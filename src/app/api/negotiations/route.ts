import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import type { CreateNegotiationRequest } from '@/types';

// GET /api/negotiations - List negotiations for the authenticated user
// Query params: role (buyer|seller), status, sellerId (for quick lookup)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'buyer';
    const status = searchParams.get('status');
    const sellerId = searchParams.get('sellerId'); // For quick single-seller lookup
    const minimal = searchParams.get('minimal') === 'true'; // For lightweight list

    // Build where clause based on role
    const whereClause: Record<string, unknown> = {};

    if (role === 'seller') {
      // Get seller ID for the current user
      const seller = await prisma.seller.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
      }
      whereClause.sellerId = seller.id;
    } else {
      whereClause.buyerId = user.id;
    }

    if (status) {
      whereClause.status = status;
    }

    // Filter by specific seller if provided
    if (sellerId && role === 'buyer') {
      whereClause.sellerId = sellerId;
    }

    // Minimal query for quick existence checks
    if (minimal) {
      const negotiations = await prisma.negotiation.findMany({
        where: whereClause,
        select: {
          id: true,
          sellerId: true,
          status: true,
          updatedAt: true,
          seller: {
            select: { id: true, companyName: true },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return NextResponse.json(
        negotiations.map((n) => ({
          id: n.id,
          sellerId: n.sellerId,
          status: n.status,
          updatedAt: n.updatedAt,
          seller: n.seller,
          itemCount: n._count.items,
        }))
      );
    }

    // Full query for listing page
    const negotiations = await prisma.negotiation.findMany({
      where: whereClause,
      include: {
        seller: {
          select: { id: true, companyName: true, city: true, country: true },
        },
        buyer: {
          select: { id: true, email: true },
        },
        items: {
          select: {
            id: true,
            vehicleId: true,
            systemPrice: true,
            offerPrice: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform to include computed values
    const negotiationsWithDetails = negotiations.map((neg) => {
      const systemTotal = neg.items.reduce(
        (sum, item) => sum + Number(item.systemPrice),
        0
      );
      const negotiatedTotal = neg.items.reduce(
        (sum, item) => sum + Number(item.offerPrice),
        0
      );

      return {
        ...neg,
        systemTotal,
        negotiatedTotal,
        savings: systemTotal - negotiatedTotal,
        tokenDueNow: negotiatedTotal * (neg.depositPercent / 100),
        finalBalance: negotiatedTotal * (1 - neg.depositPercent / 100),
        itemCount: neg.items.length,
      };
    });

    return NextResponse.json(negotiationsWithDetails);
  } catch (error) {
    console.error('Error fetching negotiations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/negotiations - Create a new negotiation
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateNegotiationRequest = await request.json();
    const { sellerId, items, incoterm = 'FOB', depositPercent = 10 } = body;

    if (!sellerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Seller ID and items are required' },
        { status: 400 }
      );
    }

    // Validate deposit percent
    if (![10, 20, 30].includes(depositPercent)) {
      return NextResponse.json(
        { error: 'Deposit percent must be 10, 20, or 30' },
        { status: 400 }
      );
    }

    // Validate incoterm
    if (!['FOB', 'CIF'].includes(incoterm)) {
      return NextResponse.json(
        { error: 'Incoterm must be FOB or CIF' },
        { status: 400 }
      );
    }

    // Get vehicles to validate and get system prices
    const vehicleIds = items.map((item) => item.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
        sellerId,
        status: 'PUBLISHED',
      },
    });

    if (vehicles.length !== vehicleIds.length) {
      return NextResponse.json(
        { error: 'One or more vehicles are invalid or not available' },
        { status: 400 }
      );
    }

    // Check for existing active negotiation with this seller
    const existingNegotiation = await prisma.negotiation.findFirst({
      where: {
        buyerId: user.id,
        sellerId,
        status: { in: ['DRAFT', 'BUYER_FINALIZED'] },
      },
    });

    if (existingNegotiation) {
      return NextResponse.json(
        { error: 'You already have an active negotiation with this seller', existingId: existingNegotiation.id },
        { status: 409 }
      );
    }

    // Create negotiation with items
    const negotiation = await prisma.negotiation.create({
      data: {
        buyerId: user.id,
        sellerId,
        incoterm,
        depositPercent,
        items: {
          create: items.map((item) => {
            const vehicle = vehicles.find((v) => v.id === item.vehicleId)!;
            return {
              vehicleId: item.vehicleId,
              systemPrice: vehicle.price || 0,
              offerPrice: item.offerPrice,
            };
          }),
        },
      },
      include: {
        seller: true,
        items: {
          include: {
            vehicle: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        messages: true,
      },
    });

    // Calculate totals
    const systemTotal = negotiation.items.reduce(
      (sum, item) => sum + Number(item.systemPrice),
      0
    );
    const negotiatedTotal = negotiation.items.reduce(
      (sum, item) => sum + Number(item.offerPrice),
      0
    );

    return NextResponse.json({
      ...negotiation,
      systemTotal,
      negotiatedTotal,
      savings: systemTotal - negotiatedTotal,
      tokenDueNow: negotiatedTotal * (depositPercent / 100),
      finalBalance: negotiatedTotal * (1 - depositPercent / 100),
    });
  } catch (error) {
    console.error('Error creating negotiation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
