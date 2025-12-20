# AI Context File - B2B Auto Marketplace

> **IMPORTANT**: Update this file at the END of every coding session!
> This file helps the next AI session understand the current state of the project.

---

## Project Overview

A B2B marketplace for UAE car dealers to bulk-purchase used cars from China. The core innovation is **dynamic grouping** - buyers can select which parameters to group cars by, enabling efficient bulk selection.

## Current State

**Last Updated**: December 20, 2024
**Last Session Focus**: Seller Inventory Management (Phase 3)
**Current Phase**: Phase 3 Complete (Seller Inventory Management Done)

### What's Been Built

- [x] Project initialized (Next.js 14 + TypeScript + Tailwind)
- [x] Database schema created and deployed to Supabase
- [x] Prisma client configured
- [x] Supabase auth setup complete (client, server, middleware)
- [x] Basic layouts created (root, seller, buyer)
- [x] Landing page with hero and features
- [x] Register page with role selection (Buyer/Seller)
- [x] Login page
- [x] Auth middleware for protected routes
- [x] Seller dashboard with stats cards
- [x] Buyer browse page (placeholder - shows all vehicles)
- [x] Vehicle detail page with full specs
- [x] Cart store (Zustand + localStorage persistence)
- [x] Cart page with seller grouping
- [x] Add to cart functionality
- [x] Seller upload page with file dropzone (P0 complete)
- [x] Excel/CSV parsing with xlsx library
- [x] Data preview table (first 5 rows)
- [x] Column mapping interface (P1 complete)
- [x] Auto-detection of common column names
- [x] Row-by-row validation with error display (P2 complete)
- [x] Bulk import to database via Prisma (P2 complete)
- [x] Import progress indicator and summary (P2 complete)
- [x] Seller inventory management page with table, filters, pagination
- [x] Status toggle (Publish/Unpublish) per vehicle
- [x] Bulk actions (publish/unpublish/delete selected)
- [x] Delete single vehicle with confirmation
- [ ] Save/load column mappings to database
- [ ] Dynamic grouping for buyers
- [ ] Checkout flow

### What's Working

1. **Authentication Flow**
   - Users can register as Buyer or Seller
   - Seller registration includes company details
   - Login/logout working
   - Protected routes redirect to login
   - Role-based routing (sellers → /seller, buyers → /buyer)

2. **Seller Dashboard**
   - Shows stats: Total vehicles, Published, Drafts
   - Quick action buttons
   - Getting started checklist

3. **Seller Upload (P0 + P1 + P2 Complete)**
   - Drag-and-drop file upload for Excel/CSV
   - File type validation (.xlsx, .xls, .csv)
   - File size validation (max 10MB)
   - Excel parsing with xlsx library
   - Preview table showing first 5 rows
   - Shows file info (name, size, row count, column count)
   - 3-step wizard UI (Upload → Map Columns → Import)
   - Column mapping interface with system fields on left, Excel column dropdowns on right
   - Auto-detection of common column names (Brand→make, Model→model, etc.)
   - Required fields: make, model, year, color, variant, condition (6 fields only)
   - Validation prevents proceeding without required fields mapped
   - Row-by-row validation with error display (row number, field, message)
   - Collapsible validation errors panel grouped by row
   - Enum normalization (condition, bodyType, fuelType, transmission, drivetrain)
   - Auto-generated placeholder VINs for vehicles without VIN mapped
   - Default values for unmapped optional fields (uses seller's city/country)
   - Bulk import to database via Prisma createMany
   - Import progress indicator
   - Success/error summary with actions (Upload Another / Go to Inventory)

4. **Buyer Features**
   - Browse page shows all published vehicles
   - Vehicle detail page with full specifications
   - Cart persists in localStorage
   - Cart groups items by seller
   - Add/remove from cart working

5. **Shared Components**
   - Header with role-based navigation
   - Cart badge with item count
   - Mobile responsive navigation

6. **Seller Inventory Management (Phase 3 Complete)**
   - Inventory list page at `/seller/inventory`
   - Table with: Checkbox, Image, Make/Model, Year, Price, VIN, Status, Actions
   - Filter by status (All, Draft, Published, Sold)
   - Search by make, model, or VIN (debounced)
   - Pagination (50 items per page) with URL params
   - Status toggle button (Publish/Unpublish) per vehicle
   - Delete single vehicle with confirmation dialog
   - Bulk selection with checkbox (select all / individual)
   - Bulk actions: Publish, Unpublish, Delete selected
   - API endpoints:
     - GET /api/seller/vehicles (list with filters, pagination)
     - PATCH /api/seller/vehicles/[id] (update status)
     - DELETE /api/seller/vehicles/[id] (remove vehicle)
     - POST /api/seller/vehicles/bulk (bulk publish/unpublish/delete)

### What's Broken / Known Issues

- Sign out redirect URL may need adjustment (currently redirects to Supabase URL)
- Dynamic grouping not implemented yet (showing flat list)
- Save/load column mappings not yet functional (UI exists, needs API routes)

---

## Technical Context

### Database
- **Provider**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Schema Status**: ✅ Deployed and working

### Key Files Modified Recently

```
src/
├── types/
│   ├── upload.ts                   # ValidationError, TransformedVehicle, ImportState types
│   └── inventory.ts                # NEW: VehicleWithImage, VehiclesResponse, InventoryFiltersState types
├── lib/
│   ├── excel-parser.ts             # Excel/CSV parsing with xlsx
│   ├── column-auto-detect.ts       # Auto-detect column name aliases
│   ├── vehicle-validator.ts        # Row validation & transformation with enum normalization
│   ├── prisma.ts                   # Prisma client singleton
│   ├── utils.ts                    # Utility functions + enum labels
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       ├── server.ts               # Server Supabase client
│       └── middleware.ts           # Session refresh logic
├── components/
│   ├── ui/
│   │   ├── collapsible.tsx         # Simple collapsible component
│   │   └── progress.tsx            # Progress bar component
│   ├── seller/
│   │   ├── upload-dropzone.tsx     # Drag-and-drop file upload
│   │   ├── data-preview.tsx        # Preview table for parsed data
│   │   ├── column-mapper.tsx       # Column mapping UI with dropdowns
│   │   ├── validation-errors.tsx   # Collapsible error list grouped by row
│   │   ├── import-progress.tsx     # Import progress with spinner
│   │   ├── import-summary.tsx      # Success/error summary with actions
│   │   ├── inventory-client.tsx    # NEW: Client wrapper for inventory with state management
│   │   ├── inventory-table.tsx     # NEW: Data table with vehicle rows
│   │   ├── inventory-filters.tsx   # NEW: Status filter + search input
│   │   ├── status-toggle.tsx       # NEW: Publish/Unpublish button
│   │   └── bulk-actions.tsx        # NEW: Bulk action buttons (publish/unpublish/delete)
│   ├── shared/
│   │   ├── header.tsx              # Main header with nav
│   │   └── cart-badge.tsx          # Cart icon with count
│   └── buyer/
│       └── add-to-cart-button.tsx  # Add to cart button
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   ├── validate/route.ts   # POST validation endpoint
│   │   │   └── import/route.ts     # POST import endpoint
│   │   └── seller/
│   │       └── vehicles/
│   │           ├── route.ts        # NEW: GET list vehicles with filters/pagination
│   │           ├── [id]/route.ts   # NEW: PATCH/DELETE single vehicle
│   │           └── bulk/route.ts   # NEW: POST bulk actions
│   ├── seller/
│   │   ├── layout.tsx              # Seller sidebar layout
│   │   ├── page.tsx                # Seller dashboard
│   │   ├── upload/
│   │   │   └── page.tsx            # Full 3-step wizard with validation & import
│   │   └── inventory/
│   │       └── page.tsx            # NEW: Inventory management page
│   └── buyer/
│       ├── layout.tsx              # Buyer layout
│       ├── page.tsx                # Browse vehicles
│       ├── cart/page.tsx           # Shopping cart
│       └── vehicle/[id]/page.tsx   # Vehicle detail
```

### Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=https://xnfljhbehrkaqiwkhfzc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0DHLveOqlQrg81M-CeI0Fg_PfXzF982

# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.xnfljhbehrkaqiwkhfzc:oHymI6ppSar1c5ch@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.xnfljhbehrkaqiwkhfzc:oHymI6ppSar1c5ch@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

### Dependencies Installed
```json
{
  "@prisma/client": "^5.22.0",
  "@supabase/ssr": "latest",
  "@supabase/supabase-js": "latest",
  "@tanstack/react-query": "latest",
  "xlsx": "latest",
  "zustand": "latest"
}
```

---

## Architecture Decisions Made

1. **Per-seller grouping**: Cars are always grouped within a single seller's inventory
2. **Column mapping for uploads**: Sellers have different Excel formats, so we provide a mapping UI
3. **Cart supports multiple sellers**: Buyers can add cars from different sellers to one cart
4. **Price shown as range**: Groups show min-max price with option to see per-unit
5. **Zustand + localStorage for cart**: Fast local updates, persists across refreshes
6. **Supabase for auth + storage**: Unified platform for MVP
7. **Client-side Excel parsing**: Using xlsx library in browser for immediate feedback

---

## User Flows Summary

### Seller Flow
1. ✅ Register as seller (with company details)
2. ✅ View dashboard
3. ✅ Upload Excel → Map columns → Validate → Import (P0+P1+P2 complete)
4. ✅ Manage inventory (list/filter/search/publish/delete) - Phase 3 complete
5. ⏳ Edit vehicle details
6. ⏳ View orders

### Buyer Flow
1. ✅ Register as buyer
2. ✅ Browse vehicles (flat list for now)
3. ⏳ Select grouping parameters
4. ⏳ Browse grouped listings
5. ✅ View vehicle details
6. ✅ Add to cart
7. ✅ View cart
8. ⏳ Checkout

---

## Key Technical Patterns

### Prisma Usage
```typescript
import { prisma } from '@/lib/prisma';

// In server components or API routes
const vehicles = await prisma.vehicle.findMany({
  where: { status: 'PUBLISHED' },
  include: { seller: true, images: true },
});
```

### Supabase Auth (Server)
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Supabase Auth (Client)
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
await supabase.auth.signInWithPassword({ email, password });
```

### Cart Store Usage
```typescript
import { useCartStore } from '@/stores/cart-store';

const addItem = useCartStore((state) => state.addItem);
const items = useCartStore((state) => state.items);
const isInCart = useCartStore((state) => state.isInCart(vehicleId));
```

### Excel Parsing
```typescript
import { parseExcelFile, ParsedExcel } from '@/lib/excel-parser';

const data: ParsedExcel = await parseExcelFile(file);
// data.headers: string[]
// data.rows: Record<string, unknown>[]
// data.totalRows: number
// data.fileName: string
// data.fileSize: number
```

### Column Mapping
```typescript
import { autoDetectMapping } from '@/lib/column-auto-detect';
import { ColumnMappingState, REQUIRED_VEHICLE_FIELDS } from '@/types/upload';

// Auto-detect maps VehicleField → Excel header
const mapping: ColumnMappingState = autoDetectMapping(headers);
// mapping = { make: 'Brand', model: 'Model', year: 'Year', ... }

// Required fields (must be mapped before import):
// make, model, year, color, variant, condition
```

### Vehicle Validation & Import
```typescript
import { validateAndTransformRows } from '@/lib/vehicle-validator';

// Client-side: Call validation API
const response = await fetch('/api/upload/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rows: parsedData.rows, mapping }),
});
const { validRows, errors, invalidRowCount } = await response.json();

// Then import valid rows
const importResponse = await fetch('/api/upload/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vehicles: validRows }),
});
const { imported, failed } = await importResponse.json();
```

---

## Next Session Should Focus On

**Priority 1: Buyer Dynamic Grouping (MVP Core!)**
- Grouping parameter selector component
- Dynamic GROUP BY API endpoint
- Grouped listings view
- Spec file: `specs/features/buyer-grouping.md`

**Priority 2: Edit Vehicle Form**
- Edit vehicle modal or page
- All fields editable
- Validate before saving

**Priority 3: Save/Load Column Mappings**
- API routes: GET/POST/DELETE /api/mappings
- Save mapping with custom name
- Load saved mappings dropdown
- Set default mapping option

---

## Notes for AI Assistant

- Always reference the relevant spec file in `/specs/features/` before implementing
- Follow the established patterns above
- Update this CONTEXT.md file at the end of the session
- Keep components small and focused
- Use TypeScript strictly - no `any` types
- All database operations go through Prisma, not raw Supabase queries
- The `xlsx` package is already installed for Excel parsing
- Cart is client-side only (Zustand) - no server sync needed for MVP
- Upload wizard uses client-side state management for multi-step flow
