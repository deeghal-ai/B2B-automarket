/**
 * Dynamic SQL query builder for vehicle grouping
 *
 * Builds GROUP BY queries based on user-selected fields.
 * Always groups by sellerId (per-seller grouping - DECISION-001).
 */

import {
  GroupingField,
  VALID_GROUPING_FIELDS,
  GroupedListing,
} from '@/types/grouping';

/**
 * Filter options for grouped listings query
 */
export interface GroupingFilters {
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  country?: string;
  make?: string;
  model?: string;
  condition?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
}

/**
 * Map of grouping field names to their SQL column references
 * Using quoted identifiers for PostgreSQL
 */
const FIELD_TO_COLUMN: Record<GroupingField, string> = {
  make: 'v."make"',
  model: 'v."model"',
  variant: 'v."variant"',
  year: 'v."year"',
  color: 'v."color"',
  condition: 'v."condition"',
  bodyType: 'v."bodyType"',
};

/**
 * Validates and filters grouping fields to prevent SQL injection
 */
export function validateGroupingFields(fields: string[]): GroupingField[] {
  return fields.filter((f): f is GroupingField =>
    VALID_GROUPING_FIELDS.includes(f as GroupingField)
  );
}

/**
 * Builds WHERE clause conditions and parameters
 */
function buildWhereClause(filters?: GroupingFilters): {
  conditions: string[];
  params: (string | number)[];
} {
  const conditions: string[] = ['v."status" = \'PUBLISHED\''];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (filters?.minPrice !== undefined) {
    conditions.push(`v."price" >= $${paramIndex}`);
    params.push(filters.minPrice);
    paramIndex++;
  }

  if (filters?.maxPrice !== undefined) {
    conditions.push(`v."price" <= $${paramIndex}`);
    params.push(filters.maxPrice);
    paramIndex++;
  }

  if (filters?.minYear !== undefined) {
    conditions.push(`v."year" >= $${paramIndex}`);
    params.push(filters.minYear);
    paramIndex++;
  }

  if (filters?.maxYear !== undefined) {
    conditions.push(`v."year" <= $${paramIndex}`);
    params.push(filters.maxYear);
    paramIndex++;
  }

  if (filters?.minMileage !== undefined) {
    conditions.push(`v."mileage" >= $${paramIndex}`);
    params.push(filters.minMileage);
    paramIndex++;
  }

  if (filters?.maxMileage !== undefined) {
    conditions.push(`v."mileage" <= $${paramIndex}`);
    params.push(filters.maxMileage);
    paramIndex++;
  }

  if (filters?.country) {
    // Use ILIKE for partial matching (e.g., "UAE" matches "United Arab Emirates")
    conditions.push(`v."country" ILIKE $${paramIndex}`);
    params.push(`%${filters.country}%`);
    paramIndex++;
  }

  if (filters?.make) {
    conditions.push(`v."make" ILIKE $${paramIndex}`);
    params.push(`%${filters.make}%`);
    paramIndex++;
  }

  if (filters?.model) {
    conditions.push(`v."model" ILIKE $${paramIndex}`);
    params.push(`%${filters.model}%`);
    paramIndex++;
  }

  // Enum fields need to be cast to text for comparison
  if (filters?.condition) {
    conditions.push(`v."condition"::text = $${paramIndex}`);
    params.push(filters.condition);
    paramIndex++;
  }

  if (filters?.bodyType) {
    conditions.push(`v."bodyType"::text = $${paramIndex}`);
    params.push(filters.bodyType);
    paramIndex++;
  }

  if (filters?.fuelType) {
    conditions.push(`v."fuelType"::text = $${paramIndex}`);
    params.push(filters.fuelType);
    paramIndex++;
  }

  if (filters?.transmission) {
    conditions.push(`v."transmission"::text = $${paramIndex}`);
    params.push(filters.transmission);
    paramIndex++;
  }

  return { conditions, params };
}

/**
 * Builds the main grouping query
 *
 * @param selectedFields - Fields to group by (validated)
 * @param filters - Optional filters
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 */
export function buildGroupingQuery(
  selectedFields: GroupingField[],
  filters?: GroupingFilters,
  page: number = 1,
  limit: number = 20
): { query: string; countQuery: string; params: (string | number)[] } {
  // Always group by seller
  const groupByColumns = [
    'v."sellerId"',
    's."companyName"',
    ...selectedFields.map((f) => FIELD_TO_COLUMN[f]),
  ];

  // Build SELECT for grouped fields
  const selectGroupedFields = selectedFields
    .map((f) => `${FIELD_TO_COLUMN[f]} as "${f}"`)
    .join(', ');

  // Build aggregations for ungrouped fields
  const ungroupedFields = VALID_GROUPING_FIELDS.filter(
    (f) => !selectedFields.includes(f)
  );

  const aggregations = ungroupedFields
    .map((f) => {
      const col = FIELD_TO_COLUMN[f];
      // Use appropriate aggregation based on field type
      if (f === 'year') {
        return `ARRAY_AGG(DISTINCT ${col})::int[] as "years"`;
      }
      return `ARRAY_AGG(DISTINCT ${col}) as "${f}s"`;
    })
    .join(', ');

  // Build WHERE clause
  const { conditions, params } = buildWhereClause(filters);
  const whereClause = conditions.join(' AND ');

  // Calculate offset
  const offset = (page - 1) * limit;

  // Main query
  const query = `
    SELECT
      v."sellerId",
      s."companyName" as "sellerName",
      ${selectGroupedFields ? selectGroupedFields + ',' : ''}
      COUNT(*)::int as "unitCount",
      MIN(v."price")::float as "minPrice",
      MAX(v."price")::float as "maxPrice",
      MIN(v."mileage")::int as "minMileage",
      MAX(v."mileage")::int as "maxMileage",
      ${aggregations ? aggregations + ',' : ''}
      ARRAY_AGG(DISTINCT v."incoterm") as "incoterms",
      ARRAY_AGG(v."id") as "vehicleIds"
    FROM "Vehicle" v
    JOIN "Seller" s ON v."sellerId" = s."id"
    WHERE ${whereClause}
    GROUP BY ${groupByColumns.join(', ')}
    ORDER BY "unitCount" DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Count query for pagination (count unique groups)
  // We need to count the number of distinct groups
  const groupByForCount = selectedFields.map((f) => FIELD_TO_COLUMN[f]).join(', ');
  const countQuery = `
    SELECT COUNT(*) as "total" FROM (
      SELECT 1
      FROM "Vehicle" v
      JOIN "Seller" s ON v."sellerId" = s."id"
      WHERE ${whereClause}
      GROUP BY v."sellerId"${groupByForCount ? ', ' + groupByForCount : ''}
    ) as groups
  `;

  return { query, countQuery, params };
}

/**
 * Builds a query to count total vehicles matching filters
 */
export function buildTotalVehiclesQuery(
  filters?: GroupingFilters
): { query: string; params: (string | number)[] } {
  const { conditions, params } = buildWhereClause(filters);
  const whereClause = conditions.join(' AND ');

  const query = `
    SELECT COUNT(*)::int as "total"
    FROM "Vehicle" v
    WHERE ${whereClause}
  `;

  return { query, params };
}

/**
 * Transforms raw SQL result to GroupedListing type
 */
export function transformToGroupedListing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: Record<string, any>,
  groupedFields: GroupingField[]
): GroupedListing {
  const listing: GroupedListing = {
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    unitCount: row.unitCount,
    minPrice: row.minPrice,
    maxPrice: row.maxPrice,
    minMileage: row.minMileage,
    maxMileage: row.maxMileage,
    vehicleIds: row.vehicleIds || [],
    // Include incoterms (filter out nulls)
    incoterms: row.incoterms ? (row.incoterms as (string | null)[]).filter((i): i is string => i !== null) : [],
  };

  // Add grouped field values
  for (const field of groupedFields) {
    if (row[field] !== undefined) {
      // Type assertion needed for dynamic field assignment
      (listing as unknown as Record<string, unknown>)[field] = row[field];
    }
  }

  // Add ungrouped field aggregations
  const ungroupedFields = VALID_GROUPING_FIELDS.filter(
    (f) => !groupedFields.includes(f)
  );

  for (const field of ungroupedFields) {
    const pluralKey = `${field}s`;
    if (row[pluralKey] !== undefined) {
      // Filter out null values from aggregated arrays
      const values = (row[pluralKey] as unknown[]).filter((v) => v !== null);
      (listing as unknown as Record<string, unknown>)[pluralKey] = values;
    }
  }

  return listing;
}

