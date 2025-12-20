import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { VehicleStatus, Prisma } from '@prisma/client';

const ITEMS_PER_PAGE = 50;

export async function GET(request: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const status = searchParams.get('status') as VehicleStatus | null;
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: Prisma.VehicleWhereInput = {
      sellerId: seller.id,
    };

    // Status filter
    if (status && Object.values(VehicleStatus).includes(status)) {
      where.status = status;
    }

    // Search filter (make, model, or VIN)
    if (search.trim()) {
      where.OR = [
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { vin: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.vehicle.count({ where });
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Fetch vehicles with pagination
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });

    return NextResponse.json({
      vehicles,
      pagination: {
        page,
        totalPages,
        totalCount,
        itemsPerPage: ITEMS_PER_PAGE,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

