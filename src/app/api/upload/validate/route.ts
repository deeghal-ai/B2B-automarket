import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { validateAndTransformRows, checkRequiredFieldsMapped } from '@/lib/vehicle-validator';
import { ColumnMappingState, ValidateResponse, ImportDefaults } from '@/types/upload';

interface ValidateRequest {
  rows: Record<string, unknown>[];
  mapping: ColumnMappingState;
  defaults?: ImportDefaults;
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
        { error: 'Only sellers can upload vehicles' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json() as ValidateRequest;
    const { rows, mapping, defaults } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'No rows to validate' },
        { status: 400 }
      );
    }

    if (!mapping || typeof mapping !== 'object') {
      return NextResponse.json(
        { error: 'Column mapping is required' },
        { status: 400 }
      );
    }

    // Check that required fields are mapped
    const missingFields = checkRequiredFieldsMapped(mapping);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Required fields not mapped: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check that pricing fields are resolved when price is mapped
    const isPriceMapped = mapping.price !== null && mapping.price !== undefined;
    if (isPriceMapped) {
      const isCurrencyMapped = mapping.currency !== null && mapping.currency !== undefined;
      const isIncotermMapped = mapping.incoterm !== null && mapping.incoterm !== undefined;
      
      if (!isCurrencyMapped && !defaults?.currency) {
        return NextResponse.json(
          { error: 'Currency must be mapped or a default selected when Price is mapped' },
          { status: 400 }
        );
      }
      
      if (!isIncotermMapped && !defaults?.incoterm) {
        return NextResponse.json(
          { error: 'Incoterm must be mapped or a default selected when Price is mapped' },
          { status: 400 }
        );
      }
    }

    // Extract VINs from rows to check for existing duplicates
    const vinsToCheck = rows
      .map(row => mapping.vin ? String(row[mapping.vin] || '').trim().toUpperCase() : null)
      .filter((vin): vin is string => vin !== null && vin !== '');

    // Query database for existing VINs
    let existingVinSet = new Set<string>();
    if (vinsToCheck.length > 0) {
      const existingVins = await prisma.vehicle.findMany({
        where: { vin: { in: vinsToCheck } },
        select: { vin: true },
      });
      existingVinSet = new Set(existingVins.map(v => v.vin));
    }

    // Validate and transform rows
    const result = validateAndTransformRows(rows, mapping, {
      city: dbUser.seller.city,
      country: dbUser.seller.country,
    }, defaults, existingVinSet);

    const response: ValidateResponse = {
      success: true,
      validRows: result.validRows,
      invalidRowCount: result.invalidRowCount,
      errors: result.errors,
      totalRows: result.totalRows,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate data' },
      { status: 500 }
    );
  }
}

