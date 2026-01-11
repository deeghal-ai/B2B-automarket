import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import type { UpdateNegotiationRequest } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/negotiations/[id] - Get negotiation details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
      include: {
        seller: true,
        buyer: true,
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
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!negotiation) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
    }

    // Check if user is the buyer or the seller
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { seller: true },
    });

    const isBuyer = negotiation.buyerId === user.id;
    const isSeller = dbUser?.seller?.id === negotiation.sellerId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      tokenDueNow: negotiatedTotal * (negotiation.depositPercent / 100),
      finalBalance: negotiatedTotal * (1 - negotiation.depositPercent / 100),
      userRole: isBuyer ? 'BUYER' : 'SELLER',
    });
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/negotiations/[id] - Update negotiation terms
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateNegotiationRequest = await request.json();
    const { items, incoterm, depositPercent } = body;

    // Get current negotiation
    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!negotiation) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
    }

    // Only buyer can update, and only in DRAFT status
    if (negotiation.buyerId !== user.id) {
      return NextResponse.json({ error: 'Only buyer can update terms' }, { status: 403 });
    }

    if (negotiation.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Cannot update terms after finalization' },
        { status: 400 }
      );
    }

    // Validate deposit percent if provided
    if (depositPercent !== undefined && ![10, 20, 30].includes(depositPercent)) {
      return NextResponse.json(
        { error: 'Deposit percent must be 10, 20, or 30' },
        { status: 400 }
      );
    }

    // Validate incoterm if provided
    if (incoterm !== undefined && !['FOB', 'CIF'].includes(incoterm)) {
      return NextResponse.json(
        { error: 'Incoterm must be FOB or CIF' },
        { status: 400 }
      );
    }

    // Update negotiation terms
    const updateData: Record<string, unknown> = {};
    if (incoterm !== undefined) updateData.incoterm = incoterm;
    if (depositPercent !== undefined) updateData.depositPercent = depositPercent;

    // Update items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        const existingItem = negotiation.items.find(
          (i) => i.vehicleId === item.vehicleId
        );
        if (existingItem) {
          await prisma.negotiationItem.update({
            where: { id: existingItem.id },
            data: { offerPrice: item.offerPrice },
          });
        }
      }
    }

    // Update the negotiation
    const updated = await prisma.negotiation.update({
      where: { id },
      data: updateData,
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
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Calculate totals
    const systemTotal = updated.items.reduce(
      (sum, item) => sum + Number(item.systemPrice),
      0
    );
    const negotiatedTotal = updated.items.reduce(
      (sum, item) => sum + Number(item.offerPrice),
      0
    );

    return NextResponse.json({
      ...updated,
      systemTotal,
      negotiatedTotal,
      savings: systemTotal - negotiatedTotal,
      tokenDueNow: negotiatedTotal * (updated.depositPercent / 100),
      finalBalance: negotiatedTotal * (1 - updated.depositPercent / 100),
      userRole: 'BUYER',
    });
  } catch (error) {
    console.error('Error updating negotiation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
