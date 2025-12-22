import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import {
  VehicleStatus,
  Prisma,
  Condition,
  BodyType,
  FuelType,
  Transmission,
  Drivetrain,
} from '@prisma/client';

const ITEMS_PER_PAGE = 50;

// Vehicle creation payload type
interface VehicleCreatePayload {
  // Basic info
  make: string;
  model: string;
  variant?: string | null;
  year: number;
  color: string;
  // Specifications
  condition: Condition;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  drivetrain: Drivetrain;
  // Engine & Performance
  engineSize?: number | null;
  cylinders?: number | null;
  horsepower?: number | null;
  // Details
  mileage: number;
  doors?: number | null;
  seatingCapacity?: number | null;
  vin: string;
  registrationNo?: string | null;
  // Location
  city: string;
  country: string;
  regionalSpecs?: string | null;
  // Pricing
  price?: number | null;
  currency: string;
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

// POST - Create new vehicle
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
    const body: VehicleCreatePayload = await request.json();

    // Validation errors
    const errors: string[] = [];

    // Validate required fields
    if (!body.make?.trim()) errors.push('Make is required');
    if (!body.model?.trim()) errors.push('Model is required');
    if (!body.color?.trim()) errors.push('Color is required');
    if (!body.year || body.year < 1900 || body.year > new Date().getFullYear() + 1) {
      errors.push('Year must be between 1900 and next year');
    }
    if (!body.vin?.trim()) errors.push('VIN is required');
    if (!body.city?.trim()) errors.push('City is required');
    if (!body.country?.trim()) errors.push('Country is required');
    if (body.mileage === undefined || body.mileage < 0) {
      errors.push('Mileage must be a positive number');
    }

    // Validate enums
    if (!body.condition || !isValidEnum(body.condition, Condition)) {
      errors.push('Valid condition is required');
    }
    if (!body.bodyType || !isValidEnum(body.bodyType, BodyType)) {
      errors.push('Valid body type is required');
    }
    if (!body.fuelType || !isValidEnum(body.fuelType, FuelType)) {
      errors.push('Valid fuel type is required');
    }
    if (!body.transmission || !isValidEnum(body.transmission, Transmission)) {
      errors.push('Valid transmission is required');
    }
    if (!body.drivetrain || !isValidEnum(body.drivetrain, Drivetrain)) {
      errors.push('Valid drivetrain is required');
    }

    // Validate VIN uniqueness
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { vin: body.vin.trim() },
    });
    if (existingVehicle) {
      errors.push('VIN already exists');
    }

    // Validate price/currency/incoterm relationship
    if (body.price !== undefined && body.price !== null && body.price > 0) {
      if (!body.currency) {
        errors.push('Currency is required when price is set');
      }
      if (!body.incoterm) {
        errors.push('Incoterm is required when price is set');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    // Create vehicle
    const newVehicle = await prisma.vehicle.create({
      data: {
        sellerId: seller.id,
        make: body.make.trim(),
        model: body.model.trim(),
        variant: body.variant?.trim() || null,
        year: body.year,
        color: body.color.trim(),
        condition: body.condition,
        bodyType: body.bodyType,
        fuelType: body.fuelType,
        transmission: body.transmission,
        drivetrain: body.drivetrain,
        engineSize: body.engineSize ?? null,
        cylinders: body.cylinders ?? null,
        horsepower: body.horsepower ?? null,
        mileage: body.mileage,
        doors: body.doors ?? null,
        seatingCapacity: body.seatingCapacity ?? null,
        vin: body.vin.trim(),
        registrationNo: body.registrationNo?.trim() || null,
        city: body.city.trim(),
        country: body.country.trim(),
        regionalSpecs: body.regionalSpecs?.trim() || null,
        price: body.price ?? null,
        currency: body.currency,
        incoterm: body.incoterm || null,
        description: body.description?.trim() || null,
        features: body.features || [],
        inspectionReportLink: body.inspectionReportLink?.trim() || null,
        status: VehicleStatus.DRAFT, // New vehicles start as DRAFT
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(newVehicle, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

