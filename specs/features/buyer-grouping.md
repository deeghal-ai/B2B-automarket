# Feature Spec: Dynamic Vehicle Grouping for Bulk Purchase

## Overview

This is the **core differentiator** of the marketplace. Buyers can select which vehicle attributes to group by, and the system dynamically aggregates vehicles from each seller based on those parameters. This enables efficient bulk selection and purchase.

## The Problem We're Solving

**Without grouping**: A buyer looking for 15 white 2022 Toyota Camrys has to scroll through individual listings, manually identify matching vehicles, and add them one by one.

**With dynamic grouping**: The buyer selects grouping by [Make + Model + Year + Color], and sees a single card showing "Toyota Camry 2022 White - 23 units available from Seller A". They can select 15 and add to cart in one action.

## User Stories

### US-1: Select Grouping Parameters
**As a** buyer
**I want to** choose which attributes to group vehicles by
**So that** I can see aggregated listings that match my bulk purchase needs

**Acceptance Criteria:**
- Checkbox interface for selecting grouping parameters
- Available parameters: Make, Model, Variant, Year, Color, Condition, Body Type
- At least one parameter must be selected
- Default selection: Make, Model, Year
- Changes apply immediately (or with "Apply" button)

### US-2: View Grouped Listings
**As a** buyer
**I want to** see aggregated vehicle listings based on my grouping
**So that** I can quickly identify bulk purchase opportunities

**Acceptance Criteria:**
- Each card represents a group (same seller + matching parameters)
- Shows: Seller name, grouped attributes, unit count, price range
- Shows what varies within the group (e.g., "Mixed variants: LE, SE")
- Sorted by unit count (highest first) by default
- Pagination for large result sets

### US-3: Expand Group to See Units
**As a** buyer
**I want to** see individual vehicles within a group
**So that** I can cherry-pick specific units

**Acceptance Criteria:**
- Expand/collapse each group card
- Shows individual vehicle cards with key details
- Each vehicle shows: Photo, VIN (last 6), Mileage, Price, Variant (if not grouped)
- Can click through to full vehicle detail page

### US-4: Bulk Select from Group
**As a** buyer
**I want to** select multiple vehicles from a group at once
**So that** I can add them to cart efficiently

**Acceptance Criteria:**
- "Select All" checkbox for the group
- Individual checkboxes per vehicle
- Quantity display: "5 of 23 selected"
- "Add Selected to Cart" button
- Clear visual feedback on selection

### US-5: Save Grouping Preference
**As a** buyer
**I want to** save my preferred grouping configuration
**So that** I don't have to set it every time

**Acceptance Criteria:**
- Grouping preference persists (localStorage)
- Optional: Save to user profile for cross-device

## UI Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🚗 Browse Vehicles                                         [🛒 Cart (5)]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ Grouping Parameters ─────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Group vehicles by:                                               │  │
│  │  ☑ Make   ☑ Model   ☐ Variant   ☑ Year   ☑ Color   ☐ Condition  │  │
│  │                                                                   │  │
│  │  [Apply Grouping]                                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Showing 47 grouped listings (892 total vehicles)                       │
│  Sort by: [Units Available ▼]                                          │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  ┌─────┐  Toyota Camry 2022 White                    Seller ABC  │  │
│  │  │ 📷  │                                                         │  │
│  │  │     │  23 units available                                     │  │
│  │  └─────┘  Price: $18,000 - $22,500                              │  │
│  │           Variants: LE (12), SE (8), XLE (3)                     │  │
│  │           Mileage range: 15,000 - 45,000 km                      │  │
│  │                                                                   │  │
│  │  [Expand to see units ▼]           [Add All to Cart]             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  ┌─────┐  Honda Accord 2022 Black                    Seller XYZ  │  │
│  │  │ 📷  │                                                         │  │
│  │  │     │  18 units available                                     │  │
│  │  └─────┘  Price: $19,500 - $24,000                              │  │
│  │           Variants: Sport (10), EX-L (8)                         │  │
│  │           Mileage range: 12,000 - 38,000 km                      │  │
│  │                                                                   │  │
│  │  [▼ Expanded - 5 of 18 selected]   [Add Selected (5) to Cart]   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐ │  │
│  │  │ ☑ Select All                                                │ │  │
│  │  ├─────────────────────────────────────────────────────────────┤ │  │
│  │  │ ☑ │ 📷 │ Sport │ 12,500km │ $19,500 │ VIN:..A4B2C │ [View] │ │  │
│  │  │ ☑ │ 📷 │ Sport │ 18,200km │ $19,200 │ VIN:..X7Y8Z │ [View] │ │  │
│  │  │ ☐ │ 📷 │ EX-L  │ 22,000km │ $23,500 │ VIN:..M3N4O │ [View] │ │  │
│  │  │ ☑ │ 📷 │ Sport │ 15,800km │ $19,800 │ VIN:..P5Q6R │ [View] │ │  │
│  │  │ ☑ │ 📷 │ EX-L  │ 28,400km │ $22,000 │ VIN:..S7T8U │ [View] │ │  │
│  │  │ ☑ │ 📷 │ Sport │ 21,000km │ $20,100 │ VIN:..V9W0X │ [View] │ │  │
│  │  │   │    │  ...show more (12 more)...                         │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [Load More Listings...]                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Dynamic Grouping Query

The key technical challenge is building a SQL query with dynamic GROUP BY clause based on user selection.

```typescript
// src/lib/grouping-query.ts

export type GroupingField = 
  | 'make' 
  | 'model' 
  | 'variant' 
  | 'year' 
  | 'color' 
  | 'condition' 
  | 'bodyType';

export interface GroupedListing {
  sellerId: string;
  sellerName: string;
  // Grouped field values (dynamic based on selection)
  groupedValues: Record<GroupingField, string | number | null>;
  // Aggregated data
  unitCount: number;
  minPrice: number;
  maxPrice: number;
  minMileage: number;
  maxMileage: number;
  // What varies within the group
  variants: string[];  // If variant not grouped
  conditions: string[]; // If condition not grouped
  // Vehicle IDs for expansion
  vehicleIds: string[];
}

// Build the dynamic query
export function buildGroupingQuery(
  selectedFields: GroupingField[],
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    country?: string;
  }
): { query: string; params: any[] } {
  
  // Always group by seller
  const groupByFields = ['v."sellerId"', ...selectedFields.map(f => `v."${f}"`)];
  const selectFields = groupByFields.join(', ');
  
  // Fields NOT selected for grouping - we'll aggregate these
  const allGroupableFields: GroupingField[] = 
    ['make', 'model', 'variant', 'year', 'color', 'condition', 'bodyType'];
  const ungroupedFields = allGroupableFields.filter(f => !selectedFields.includes(f));
  
  // Build aggregations for ungrouped fields
  const aggregations = ungroupedFields
    .map(f => `ARRAY_AGG(DISTINCT v."${f}") as "${f}s"`)
    .join(', ');
  
  const query = `
    SELECT 
      ${selectFields},
      s."companyName" as "sellerName",
      COUNT(*)::int as "unitCount",
      MIN(v.price)::float as "minPrice",
      MAX(v.price)::float as "maxPrice",
      MIN(v.mileage)::int as "minMileage",
      MAX(v.mileage)::int as "maxMileage",
      ${aggregations ? aggregations + ',' : ''}
      ARRAY_AGG(v.id) as "vehicleIds"
    FROM vehicles v
    JOIN sellers s ON v."sellerId" = s.id
    WHERE v.status = 'PUBLISHED'
      ${filters?.minPrice ? 'AND v.price >= $1' : ''}
      ${filters?.maxPrice ? 'AND v.price <= $2' : ''}
      ${filters?.country ? 'AND v.country = $3' : ''}
    GROUP BY ${groupByFields.join(', ')}, s."companyName"
    ORDER BY "unitCount" DESC
  `;
  
  const params = [
    filters?.minPrice,
    filters?.maxPrice,
    filters?.country,
  ].filter(Boolean);
  
  return { query, params };
}
```

### Using Prisma with Raw Queries

Since Prisma doesn't support dynamic GROUP BY, we use `$queryRawUnsafe` carefully:

```typescript
// src/app/api/vehicles/grouped/route.ts
import { prisma } from '@/lib/prisma';
import { buildGroupingQuery, GroupingField } from '@/lib/grouping-query';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { groupBy, filters, page = 1, limit = 20 } = body;
  
  // Validate groupBy fields
  const validFields: GroupingField[] = 
    ['make', 'model', 'variant', 'year', 'color', 'condition', 'bodyType'];
  
  const selectedFields = (groupBy as GroupingField[])
    .filter(f => validFields.includes(f));
  
  if (selectedFields.length === 0) {
    return NextResponse.json(
      { error: 'At least one grouping field required' },
      { status: 400 }
    );
  }
  
  const { query, params } = buildGroupingQuery(selectedFields, filters);
  
  // Add pagination
  const offset = (page - 1) * limit;
  const paginatedQuery = `${query} LIMIT ${limit} OFFSET ${offset}`;
  
  try {
    const results = await prisma.$queryRawUnsafe(paginatedQuery, ...params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT (${selectedFields.map(f => `"${f}"`).join(' || ')} || "sellerId"))
      FROM vehicles
      WHERE status = 'PUBLISHED'
    `;
    const [{ count }] = await prisma.$queryRawUnsafe(countQuery);
    
    return NextResponse.json({
      listings: results,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error('Grouping query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grouped listings' },
      { status: 500 }
    );
  }
}
```

### Fetch Vehicles Within Group

```typescript
// src/app/api/vehicles/by-ids/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { vehicleIds } = await request.json();
  
  if (!vehicleIds || !Array.isArray(vehicleIds)) {
    return NextResponse.json({ error: 'vehicleIds required' }, { status: 400 });
  }
  
  const vehicles = await prisma.vehicle.findMany({
    where: {
      id: { in: vehicleIds },
      status: 'PUBLISHED',
    },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    orderBy: { price: 'asc' },
  });
  
  return NextResponse.json(vehicles);
}
```

## React Components

### GroupingSelector Component

```typescript
// src/components/buyer/grouping-selector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GroupingField } from '@/lib/grouping-query';

const GROUPING_OPTIONS: { field: GroupingField; label: string }[] = [
  { field: 'make', label: 'Make' },
  { field: 'model', label: 'Model' },
  { field: 'variant', label: 'Variant' },
  { field: 'year', label: 'Year' },
  { field: 'color', label: 'Color' },
  { field: 'condition', label: 'Condition' },
  { field: 'bodyType', label: 'Body Type' },
];

interface Props {
  value: GroupingField[];
  onChange: (fields: GroupingField[]) => void;
}

export function GroupingSelector({ value, onChange }: Props) {
  const toggle = (field: GroupingField) => {
    if (value.includes(field)) {
      // Don't allow removing if it's the last one
      if (value.length > 1) {
        onChange(value.filter(f => f !== field));
      }
    } else {
      onChange([...value, field]);
    }
  };
  
  return (
    <div className="p-4 bg-muted rounded-lg">
      <p className="text-sm font-medium mb-3">Group vehicles by:</p>
      <div className="flex flex-wrap gap-4">
        {GROUPING_OPTIONS.map(({ field, label }) => (
          <label key={field} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={value.includes(field)}
              onCheckedChange={() => toggle(field)}
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

### GroupedListingCard Component

```typescript
// src/components/buyer/grouped-listing-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';
import { GroupedListing } from '@/lib/grouping-query';
import { VehicleSelectionList } from './vehicle-selection-list';

interface Props {
  listing: GroupedListing;
  groupedFields: string[];
  onAddToCart: (vehicleIds: string[]) => void;
}

export function GroupedListingCard({ listing, groupedFields, onAddToCart }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Build display title from grouped values
  const title = groupedFields
    .map(field => listing.groupedValues[field])
    .filter(Boolean)
    .join(' ');
  
  // Format price range
  const priceRange = listing.minPrice === listing.maxPrice
    ? `$${listing.minPrice.toLocaleString()}`
    : `$${listing.minPrice.toLocaleString()} - $${listing.maxPrice.toLocaleString()}`;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Placeholder for image */}
          <div className="w-24 h-24 bg-muted rounded flex-shrink-0" />
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{listing.sellerName}</p>
              </div>
              <Badge variant="secondary">
                {listing.unitCount} units
              </Badge>
            </div>
            
            <div className="mt-2 space-y-1 text-sm">
              <p><strong>Price:</strong> {priceRange}</p>
              <p><strong>Mileage:</strong> {listing.minMileage.toLocaleString()} - {listing.maxMileage.toLocaleString()} km</p>
              
              {/* Show what varies within the group */}
              {listing.variants?.length > 1 && (
                <p><strong>Variants:</strong> {listing.variants.join(', ')}</p>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {expanded ? 'Collapse' : `View ${listing.unitCount} units`}
              </Button>
              
              <Button
                size="sm"
                onClick={() => onAddToCart(selectedIds.length > 0 ? selectedIds : listing.vehicleIds)}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                {selectedIds.length > 0 
                  ? `Add ${selectedIds.length} to Cart`
                  : `Add All (${listing.unitCount}) to Cart`
                }
              </Button>
            </div>
          </div>
        </div>
        
        {/* Expanded view with individual vehicles */}
        {expanded && (
          <VehicleSelectionList
            vehicleIds={listing.vehicleIds}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

## Files to Create

```
src/
├── app/
│   └── buyer/
│       └── page.tsx                    # Main browse page with grouping
├── components/
│   └── buyer/
│       ├── grouping-selector.tsx       # Checkbox UI for selecting params
│       ├── grouped-listing-card.tsx    # Card for each group
│       ├── vehicle-selection-list.tsx  # Expandable list within group
│       ├── vehicle-mini-card.tsx       # Small card in selection list
│       └── add-to-cart-button.tsx      # Bulk add to cart
├── lib/
│   └── grouping-query.ts               # Dynamic query builder
└── app/
    └── api/
        └── vehicles/
            ├── grouped/route.ts        # Get grouped listings
            └── by-ids/route.ts         # Get specific vehicles by ID
```

## State Management

```typescript
// Use URL params for grouping state (shareable, bookmarkable)
// src/app/buyer/page.tsx

export default function BuyerPage({
  searchParams,
}: {
  searchParams: { groupBy?: string };
}) {
  // Parse groupBy from URL: ?groupBy=make,model,year
  const groupBy = searchParams.groupBy?.split(',') || ['make', 'model', 'year'];
  
  // Fetch grouped listings server-side
  const listings = await fetchGroupedListings(groupBy);
  
  return (
    <div>
      <GroupingSelector value={groupBy} />
      <GroupedListings listings={listings} groupedFields={groupBy} />
    </div>
  );
}
```

## Performance Considerations

1. **Database Indexes**: Ensure composite indexes on grouping fields
2. **Pagination**: Limit results per page (20-50 groups)
3. **Lazy Load Expansion**: Only fetch individual vehicles when group is expanded
4. **Caching**: Consider caching popular group queries (React Query handles this client-side)

