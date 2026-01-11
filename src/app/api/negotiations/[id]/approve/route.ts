import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/negotiations/[id]/approve - Seller approves terms
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the seller profile
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { seller: true },
    });

    if (!dbUser?.seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 403 });
    }

    // Get current negotiation
    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
      include: {
        items: {
          include: { vehicle: true },
        },
      },
    });

    if (!negotiation) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
    }

    // Only seller can approve
    if (negotiation.sellerId !== dbUser.seller.id) {
      return NextResponse.json({ error: 'Only seller can approve terms' }, { status: 403 });
    }

    // Can only approve from BUYER_FINALIZED status
    if (negotiation.status !== 'BUYER_FINALIZED') {
      return NextResponse.json(
        { error: 'Can only approve after buyer has finalized' },
        { status: 400 }
      );
    }

    // Check if all vehicles are still available
    const vehicleIds = negotiation.items.map((item) => item.vehicleId);
    const availableVehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
        status: 'PUBLISHED',
      },
    });

    if (availableVehicles.length !== vehicleIds.length) {
      return NextResponse.json(
        { error: 'One or more vehicles are no longer available' },
        { status: 400 }
      );
    }

    // Update status to SELLER_APPROVED
    const updated = await prisma.negotiation.update({
      where: { id },
      data: { status: 'SELLER_APPROVED' },
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
      userRole: 'SELLER',
    });
  } catch (error) {
    console.error('Error approving negotiation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
