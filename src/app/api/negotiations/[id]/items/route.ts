import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/negotiations/[id]/items - Add items to existing negotiation
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Get current negotiation
    const negotiation = await prisma.negotiation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!negotiation) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
    }

    // Only buyer can add items
    if (negotiation.buyerId !== user.id) {
      return NextResponse.json({ error: 'Only buyer can add items' }, { status: 403 });
    }

    // Can only add items when status is DRAFT
    if (negotiation.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Cannot add items after finalization' },
        { status: 400 }
      );
    }

    // Get vehicle IDs to add
    const vehicleIds = items.map((item: { vehicleId: string }) => item.vehicleId);
    
    // Filter out items that already exist in the negotiation
    const existingVehicleIds = new Set(negotiation.items.map((i) => i.vehicleId));
    const newVehicleIds = vehicleIds.filter((id: string) => !existingVehicleIds.has(id));

    if (newVehicleIds.length === 0) {
      return NextResponse.json({ message: 'All items already in negotiation', added: 0 });
    }

    // Validate vehicles exist and belong to the same seller
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: newVehicleIds },
        sellerId: negotiation.sellerId,
        status: 'PUBLISHED',
      },
    });

    if (vehicles.length !== newVehicleIds.length) {
      return NextResponse.json(
        { error: 'One or more vehicles are invalid or not available' },
        { status: 400 }
      );
    }

    // Create new negotiation items
    const newItems = items
      .filter((item: { vehicleId: string }) => newVehicleIds.includes(item.vehicleId))
      .map((item: { vehicleId: string; offerPrice: number }) => {
        const vehicle = vehicles.find((v) => v.id === item.vehicleId)!;
        return {
          negotiationId: id,
          vehicleId: item.vehicleId,
          systemPrice: vehicle.price || 0,
          offerPrice: item.offerPrice,
        };
      });

    await prisma.negotiationItem.createMany({
      data: newItems,
    });

    // Fetch updated negotiation
    const updated = await prisma.negotiation.findUnique({
      where: { id },
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
    const systemTotal = updated!.items.reduce(
      (sum, item) => sum + Number(item.systemPrice),
      0
    );
    const negotiatedTotal = updated!.items.reduce(
      (sum, item) => sum + Number(item.offerPrice),
      0
    );

    return NextResponse.json({
      ...updated,
      systemTotal,
      negotiatedTotal,
      savings: systemTotal - negotiatedTotal,
      tokenDueNow: negotiatedTotal * (updated!.depositPercent / 100),
      finalBalance: negotiatedTotal * (1 - updated!.depositPercent / 100),
      userRole: 'BUYER',
      added: newItems.length,
    });
  } catch (error) {
    console.error('Error adding items to negotiation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
