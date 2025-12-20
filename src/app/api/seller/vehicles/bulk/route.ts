import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { VehicleStatus } from '@prisma/client';

type BulkAction = 'publish' | 'unpublish' | 'delete';

interface BulkRequestBody {
  action: BulkAction;
  vehicleIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get seller
    const seller = await prisma.seller.findUnique({
      where: { userId: authUser.id },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Parse body
    const body: BulkRequestBody = await request.json();
    const { action, vehicleIds } = body;

    if (!action || !vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify all vehicles belong to seller
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
        sellerId: seller.id,
      },
      select: { id: true },
    });

    const ownedIds = vehicles.map((v) => v.id);
    const unauthorizedIds = vehicleIds.filter((id) => !ownedIds.includes(id));

    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { error: 'Some vehicles not found or not owned by you' },
        { status: 403 }
      );
    }

    // Perform action
    let result: { count: number };

    switch (action) {
      case 'publish':
        result = await prisma.vehicle.updateMany({
          where: { id: { in: vehicleIds } },
          data: { status: VehicleStatus.PUBLISHED },
        });
        break;

      case 'unpublish':
        result = await prisma.vehicle.updateMany({
          where: { id: { in: vehicleIds } },
          data: { status: VehicleStatus.DRAFT },
        });
        break;

      case 'delete':
        result = await prisma.vehicle.deleteMany({
          where: { id: { in: vehicleIds } },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      affectedCount: result.count,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

