/**
 * POST /api/vehicles/by-ids
 *
 * Fetches vehicles by their IDs. Used when expanding a grouped listing
 * to show individual vehicles within the group.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VehiclesByIdsRequest, VehicleWithImage } from '@/types/grouping';

export async function POST(request: Request) {
  try {
    const body: VehiclesByIdsRequest = await request.json();
    const { vehicleIds } = body;

    // Validate input
    if (!vehicleIds || !Array.isArray(vehicleIds)) {
      return NextResponse.json(
        { error: 'vehicleIds array is required' },
        { status: 400 }
      );
    }

    if (vehicleIds.length === 0) {
      return NextResponse.json([]);
    }

    // Limit to prevent abuse (max 100 vehicles at a time)
    const limitedIds = vehicleIds.slice(0, 100);

    // Fetch vehicles with their primary image
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: limitedIds },
        status: 'PUBLISHED', // Only return published vehicles
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { price: 'asc' },
    });

    // Transform to VehicleWithImage format
    const result: VehicleWithImage[] = vehicles.map((vehicle) => ({
      id: vehicle.id,
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      year: vehicle.year,
      color: vehicle.color,
      condition: vehicle.condition,
      bodyType: vehicle.bodyType,
      mileage: vehicle.mileage,
      price: vehicle.price !== null ? Number(vehicle.price) : null,
      currency: vehicle.currency,
      incoterm: vehicle.incoterm,
      city: vehicle.city,
      country: vehicle.country,
      sellerId: vehicle.sellerId,
      primaryImage: vehicle.images[0]?.url || null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Vehicles by IDs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

