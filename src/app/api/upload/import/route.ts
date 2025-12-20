import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { TransformedVehicle, ImportResponse } from '@/types/upload';
import { Prisma } from '@prisma/client';

interface ImportRequest {
  vehicles: TransformedVehicle[];
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get seller info from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { seller: true },
    });

    if (!dbUser || dbUser.role !== 'SELLER' || !dbUser.seller) {
      return NextResponse.json(
        { error: 'Only sellers can import vehicles' },
        { status: 403 }
      );
    }

    const sellerId = dbUser.seller.id;

    // Parse request body
    const body = await request.json() as ImportRequest;
    const { vehicles } = body;

    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json(
        { error: 'No vehicles to import' },
        { status: 400 }
      );
    }

    // Limit batch size for safety
    const MAX_BATCH_SIZE = 500;
    if (vehicles.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} vehicles per import` },
        { status: 400 }
      );
    }

    // Prepare vehicle data for Prisma
    const vehicleData: Prisma.VehicleCreateManyInput[] = vehicles.map((v) => ({
      sellerId,
      vin: v.vin,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      condition: v.condition as Prisma.VehicleCreateManyInput['condition'],
      bodyType: v.bodyType as Prisma.VehicleCreateManyInput['bodyType'],
      fuelType: v.fuelType as Prisma.VehicleCreateManyInput['fuelType'],
      transmission: v.transmission as Prisma.VehicleCreateManyInput['transmission'],
      drivetrain: v.drivetrain as Prisma.VehicleCreateManyInput['drivetrain'],
      mileage: v.mileage,
      price: new Prisma.Decimal(v.price),
      city: v.city,
      country: v.country,
      currency: v.currency,
      status: 'DRAFT', // Always import as draft
      // Optional fields
      variant: v.variant ?? null,
      registrationNo: v.registrationNo ?? null,
      regionalSpecs: v.regionalSpecs ?? null,
      engineSize: v.engineSize ?? null,
      cylinders: v.cylinders ?? null,
      horsepower: v.horsepower ?? null,
      seatingCapacity: v.seatingCapacity ?? null,
      doors: v.doors ?? null,
      description: v.description ?? null,
      features: v.features ?? [],
    }));

    // Import using createMany for performance
    // skipDuplicates will skip any vehicles with duplicate VINs
    const result = await prisma.vehicle.createMany({
      data: vehicleData,
      skipDuplicates: true,
    });

    const imported = result.count;
    const skipped = vehicles.length - imported;

    const response: ImportResponse = {
      success: true,
      imported,
      failed: skipped,
      errors: skipped > 0 
        ? [{ index: -1, message: `${skipped} vehicle(s) skipped (likely duplicate VINs)` }]
        : [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Import error:', error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Duplicate VIN detected',
            imported: 0,
            failed: 0,
            errors: [{ index: -1, message: 'One or more VINs already exist in your inventory' }],
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to import vehicles',
        imported: 0,
        failed: 0,
        errors: [{ index: -1, message: 'Database error occurred during import' }],
      },
      { status: 500 }
    );
  }
}

