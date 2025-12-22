/**
 * POST /api/vehicles/flat
 *
 * Returns flat (non-grouped) vehicle listings with sorting and filtering.
 * Used when the buyer switches to "Flat View" mode.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  FlatListingsRequest,
  FlatListingsResponse,
  FlatSortField,
  SortOrder,
  VehicleWithSellerInfo,
} from '@/types/grouping';
import { buildWhereClause, GroupingFilters } from '@/lib/grouping-query';

/**
 * Valid sort fields mapped to SQL column references
 */
const SORT_FIELD_TO_COLUMN: Record<FlatSortField, string> = {
  make: 'v."make"',
  model: 'v."model"',
  year: 'v."year"',
  price: 'v."price"',
  mileage: 'v."mileage"',
  createdAt: 'v."createdAt"',
};

const VALID_SORT_FIELDS: FlatSortField[] = [
  'make',
  'model',
  'year',
  'price',
  'mileage',
  'createdAt',
];

export async function POST(request: Request) {
  try {
    const body: FlatListingsRequest = await request.json();
    const {
      filters,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = body;

    // Validate pagination params
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.min(100, Math.max(1, Math.floor(limit)));

    // Validate sort params
    const validSortBy: FlatSortField = VALID_SORT_FIELDS.includes(sortBy as FlatSortField)
      ? (sortBy as FlatSortField)
      : 'createdAt';
    const validSortOrder: SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    // Build WHERE clause using shared function
    const { conditions, params } = buildWhereClause(filters as GroupingFilters);
    const whereClause = conditions.join(' AND ');

    // Calculate offset
    const offset = (validPage - 1) * validLimit;

    // Build the main query
    const sortColumn = SORT_FIELD_TO_COLUMN[validSortBy];
    
    // Handle NULL prices - put them at the end when sorting by price
    let orderClause: string;
    if (validSortBy === 'price') {
      orderClause = validSortOrder === 'asc'
        ? `${sortColumn} ASC NULLS LAST`
        : `${sortColumn} DESC NULLS LAST`;
    } else {
      orderClause = `${sortColumn} ${validSortOrder.toUpperCase()}`;
    }

    const query = `
      SELECT
        v."id",
        v."vin",
        v."make",
        v."model",
        v."variant",
        v."year",
        v."color",
        v."condition",
        v."bodyType",
        v."mileage",
        v."price",
        v."currency",
        v."incoterm",
        v."city",
        v."country",
        v."sellerId",
        s."companyName" as "sellerName",
        (
          SELECT vi."url"
          FROM "VehicleImage" vi
          WHERE vi."vehicleId" = v."id" AND vi."isPrimary" = true
          LIMIT 1
        ) as "primaryImage"
      FROM "Vehicle" v
      JOIN "Seller" s ON v."sellerId" = s."id"
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT ${validLimit} OFFSET ${offset}
    `;

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*)::int as "total"
      FROM "Vehicle" v
      WHERE ${whereClause}
    `;

    // Execute queries in parallel
    const [rawVehicles, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(query, ...params),
      prisma.$queryRawUnsafe(countQuery, ...params),
    ]);

    const vehicles = (rawVehicles as Record<string, unknown>[]).map((row): VehicleWithSellerInfo => ({
      id: row.id as string,
      vin: row.vin as string,
      make: row.make as string,
      model: row.model as string,
      variant: row.variant as string | null,
      year: row.year as number,
      color: row.color as string,
      condition: row.condition as string,
      bodyType: row.bodyType as string,
      mileage: row.mileage as number,
      price: row.price !== null ? Number(row.price) : null,
      currency: row.currency as string | null,
      incoterm: row.incoterm as string | null,
      city: row.city as string,
      country: row.country as string,
      sellerId: row.sellerId as string,
      sellerName: row.sellerName as string,
      primaryImage: row.primaryImage as string | null,
    }));

    const total = (countResult as { total: number }[])[0]?.total ?? 0;

    const response: FlatListingsResponse = {
      vehicles,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Flat listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flat listings' },
      { status: 500 }
    );
  }
}

