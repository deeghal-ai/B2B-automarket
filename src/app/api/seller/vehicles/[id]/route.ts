import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  VehicleStatus,
  Condition,
  BodyType,
  FuelType,
  Transmission,
  Drivetrain,
} from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Vehicle update payload type
interface VehicleUpdatePayload {
  // Status (for quick status toggle)
  status?: VehicleStatus;
  // Basic info
  make?: string;
  model?: string;
  variant?: string | null;
  year?: number;
  color?: string;
  // Specifications
  condition?: Condition;
  bodyType?: BodyType;
  fuelType?: FuelType;
  transmission?: Transmission;
  drivetrain?: Drivetrain;
  // Engine & Performance
  engineSize?: number | null;
  cylinders?: number | null;
  horsepower?: number | null;
  // Details
  mileage?: number;
  doors?: number | null;
  seatingCapacity?: number | null;
  vin?: string;
  registrationNo?: string | null;
  // Location
  city?: string;
  country?: string;
  regionalSpecs?: string | null;
  // Pricing
  price?: number | null;
  currency?: string;
  incoterm?: string | null;
  // Additional
  description?: string | null;
  features?: string[];
  inspectionReportLink?: string | null;
}

// Validate enum values
function isValidEnum<T extends object>(value: string, enumObj: T): boolean {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

// PATCH - Update vehicle (supports both status-only and full updates)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Verify vehicle belongs to seller
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    if (vehicle.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse body
    const body: VehicleUpdatePayload = await request.json();

    // Validation errors
    const errors: string[] = [];

    // Validate status if provided
    if (body.status !== undefined && !isValidEnum(body.status, VehicleStatus)) {
      errors.push('Invalid status');
    }

    // Validate enums if provided
    if (body.condition !== undefined && !isValidEnum(body.condition, Condition)) {
      errors.push('Invalid condition');
    }
    if (body.bodyType !== undefined && !isValidEnum(body.bodyType, BodyType)) {
      errors.push('Invalid body type');
    }
    if (body.fuelType !== undefined && !isValidEnum(body.fuelType, FuelType)) {
      errors.push('Invalid fuel type');
    }
    if (body.transmission !== undefined && !isValidEnum(body.transmission, Transmission)) {
      errors.push('Invalid transmission');
    }
    if (body.drivetrain !== undefined && !isValidEnum(body.drivetrain, Drivetrain)) {
      errors.push('Invalid drivetrain');
    }

    // Validate required fields if this is a full update (check if any non-status field is present)
    const isFullUpdate = Object.keys(body).some((key) => key !== 'status');
    if (isFullUpdate) {
      if (body.make !== undefined && !body.make.trim()) {
        errors.push('Make is required');
      }
      if (body.model !== undefined && !body.model.trim()) {
        errors.push('Model is required');
      }
      if (body.year !== undefined && (body.year < 1900 || body.year > new Date().getFullYear() + 1)) {
        errors.push('Invalid year');
      }
      if (body.color !== undefined && !body.color.trim()) {
        errors.push('Color is required');
      }
      if (body.mileage !== undefined && body.mileage < 0) {
        errors.push('Mileage cannot be negative');
      }
    }

    // Validate VIN uniqueness if changed
    if (body.vin !== undefined && body.vin !== vehicle.vin) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { vin: body.vin },
      });
      if (existingVehicle) {
        errors.push('VIN already exists');
      }
    }

    // Validate price/currency/incoterm relationship
    if (body.price !== undefined && body.price !== null && body.price > 0) {
      // If updating price to a non-null value, check currency and incoterm
      const currency = body.currency ?? vehicle.currency;
      const incoterm = body.incoterm ?? vehicle.incoterm;
      if (!currency) {
        errors.push('Currency is required when price is set');
      }
      if (!incoterm) {
        errors.push('Incoterm is required when price is set');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Only include fields that are explicitly provided
    if (body.status !== undefined) updateData.status = body.status;
    if (body.make !== undefined) updateData.make = body.make.trim();
    if (body.model !== undefined) updateData.model = body.model.trim();
    if (body.variant !== undefined) updateData.variant = body.variant?.trim() || null;
    if (body.year !== undefined) updateData.year = body.year;
    if (body.color !== undefined) updateData.color = body.color.trim();
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.bodyType !== undefined) updateData.bodyType = body.bodyType;
    if (body.fuelType !== undefined) updateData.fuelType = body.fuelType;
    if (body.transmission !== undefined) updateData.transmission = body.transmission;
    if (body.drivetrain !== undefined) updateData.drivetrain = body.drivetrain;
    if (body.engineSize !== undefined) updateData.engineSize = body.engineSize;
    if (body.cylinders !== undefined) updateData.cylinders = body.cylinders;
    if (body.horsepower !== undefined) updateData.horsepower = body.horsepower;
    if (body.mileage !== undefined) updateData.mileage = body.mileage;
    if (body.doors !== undefined) updateData.doors = body.doors;
    if (body.seatingCapacity !== undefined) updateData.seatingCapacity = body.seatingCapacity;
    if (body.vin !== undefined) updateData.vin = body.vin.trim();
    if (body.registrationNo !== undefined) updateData.registrationNo = body.registrationNo?.trim() || null;
    if (body.city !== undefined) updateData.city = body.city.trim();
    if (body.country !== undefined) updateData.country = body.country.trim();
    if (body.regionalSpecs !== undefined) updateData.regionalSpecs = body.regionalSpecs?.trim() || null;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.incoterm !== undefined) updateData.incoterm = body.incoterm;
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.inspectionReportLink !== undefined) updateData.inspectionReportLink = body.inspectionReportLink?.trim() || null;

    // Update vehicle
    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE - Remove vehicle
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Verify vehicle belongs to seller
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    if (vehicle.sellerId !== seller.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete vehicle (cascade will handle images, cart items, etc.)
    await prisma.vehicle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

