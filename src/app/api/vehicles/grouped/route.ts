/**
 * POST /api/vehicles/grouped
 *
 * Returns grouped vehicle listings based on selected grouping parameters.
 * This is the core API for the dynamic grouping feature.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  GroupedListingsRequest,
  GroupedListingsResponse,
  DEFAULT_GROUPING_FIELDS,
} from '@/types/grouping';
import {
  validateGroupingFields,
  buildGroupingQuery,
  buildTotalVehiclesQuery,
  transformToGroupedListing,
} from '@/lib/grouping-query';

export async function POST(request: Request) {
  try {
    const body: GroupedListingsRequest = await request.json();
    const { groupBy, filters, page = 1, limit = 20 } = body;

    // Validate and sanitize groupBy fields
    const rawFields = Array.isArray(groupBy) ? groupBy : DEFAULT_GROUPING_FIELDS;
    const validatedFields = validateGroupingFields(rawFields);

    // Must have at least one grouping field
    if (validatedFields.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid grouping field is required' },
        { status: 400 }
      );
    }

    // Validate pagination params
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.min(100, Math.max(1, Math.floor(limit)));

    // Build and execute the grouping query
    const { query, countQuery, params } = buildGroupingQuery(
      validatedFields,
      filters,
      validPage,
      validLimit
    );

    // Execute queries in parallel
    const [rawListings, countResult, totalVehiclesResult] = await Promise.all([
      prisma.$queryRawUnsafe(query, ...params),
      prisma.$queryRawUnsafe(countQuery, ...params),
      prisma.$queryRawUnsafe(
        ...Object.values(buildTotalVehiclesQuery(filters))
      ),
    ]);

    // Transform raw results to typed GroupedListing objects
    const listings = (rawListings as Record<string, unknown>[]).map((row) =>
      transformToGroupedListing(row, validatedFields)
    );

    // Extract counts
    const totalGroups = Number(
      (countResult as { total: bigint }[])[0]?.total ?? 0
    );
    const totalVehicles = Number(
      (totalVehiclesResult as { total: number }[])[0]?.total ?? 0
    );

    const response: GroupedListingsResponse = {
      listings,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: totalGroups,
        totalPages: Math.ceil(totalGroups / validLimit),
      },
      totalVehicles,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Grouped listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grouped listings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vehicles/grouped
 *
 * Convenience endpoint that uses default grouping (make, model, year)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  // Convert to POST request with defaults
  const body: GroupedListingsRequest = {
    groupBy: DEFAULT_GROUPING_FIELDS,
    page,
    limit,
  };

  // Create a new request with the body
  const postRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return POST(postRequest);
}

