# AI Context File - B2B Auto Marketplace

> **IMPORTANT**: Update this file at the END of every coding session!
> This file helps the next AI session understand the current state of the project.

---

## Project Overview

A B2B marketplace for UAE car dealers to bulk-purchase used cars from China. The core innovation is **dynamic grouping** - buyers can select which parameters to group cars by, enabling efficient bulk selection.

## Current State

**Last Updated**: January 11, 2026
**Last Session Focus**: Negotiation Module Fixes + Approved Deals Page
**Current Phase**: Phase 4 Complete + Negotiation Module Complete + Approved Deals + Fuzzy Matching Designed
**Production URL**: https://b2-b-automarket.vercel.app

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
- [x] Edit vehicle page with full form and validation
- [x] Vehicle image upload with Supabase Storage
- [x] Dynamic grouping API endpoint (POST /api/vehicles/grouped)
- [x] Vehicle by IDs API endpoint (POST /api/vehicles/by-ids)
- [x] Grouping selector UI component
- [x] Grouped listing cards with expand/collapse
- [x] Vehicle selection list with bulk add to cart
- [x] Buyer browse page with dynamic grouping
- [x] AD Ports design refresh (styling only, functionality preserved)
- [x] Inspection report scraping with OpenAI API (HTTP fetch + GPT-4o-mini)
- [x] InspectionReport database model with caching
- [x] Inspection report display on vehicle detail page
- [x] Cart duplicate awareness (visual feedback when vehicles already in cart)
- [x] Grouped/Flat view toggle on browse page
- [x] Flat listings API endpoint (POST /api/vehicles/flat) with sorting
- [x] Flat listings table with sortable columns, checkboxes, add-to-cart
- [x] View mode persisted in URL and localStorage
- [x] **Vercel deployment configured with serverless Chromium**
- [x] **DESIGNED: Fuzzy matching for Make/Model/Variant validation** (implementation files ready)
- [x] **VIN duplicate validation during upload** - checks existing VINs before import
- [x] **Grouped view temporarily disabled** - shows "(Soon)" indicator, code preserved for later
- [x] **Negotiation Module** - seller-level deal rooms with price/terms negotiation and chat
- [ ] Save/load column mappings to database
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

3. **Seller Upload (P0 + P1 + P2 Complete + Pricing Enhancements)**
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
   - **NEW**: Condition accepts letter grades (A/B/C/D) common in Asian markets
   - Auto-generated placeholder VINs for vehicles without VIN mapped
   - Default values for unmapped optional fields (uses seller's city/country)
   - Bulk import to database via Prisma createMany
   - Import progress indicator
   - Success/error summary with actions (Upload Another / Go to Inventory)
   - **NEW**: Pricing section with conditional fields:
     - Price field (optional) - if not mapped, vehicles display as "RFQ"
     - When price is mapped, currency and incoterm become required
     - Currency dropdown fallback (USD, AED, CNY, EUR) when not mapped from Excel
     - Incoterm toggle (FOB/CIF) when not mapped from Excel
     - Inspection Report Link field (optional URL)
   - **DESIGNED (Ready to Implement)**: Fuzzy matching for Make/Model/Variant
     - New Step 3 "Review Matches" between Map Columns and Import
     - Validates Make/Model/Variant against master database
     - Auto-corrects typos (≥90% match)
     - Flags for review (70-89% match)
     - Rejects no-match (<70% match)
     - See files in `/mnt/user-data/outputs/` for implementation
   - **NEW**: VIN Duplicate Validation
     - Checks uploaded VINs against existing database records before import
     - Shows duplicate VINs as validation errors with row numbers
     - Automatically excludes duplicate VIN rows from import
     - Efficient single DB query using `IN` clause

4. **Buyer Features (Phase 4 Complete)**
   - Browse page with dynamic grouping
   - **Grouped/Flat View Toggle**:
     - Toggle between "Grouped" and "Flat" view modes
     - **Grouped: TEMPORARILY DISABLED** (shows "Soon" indicator, code preserved)
     - Flat: Table view of individual vehicles with sortable columns
     - View mode saved to URL and localStorage
     - To re-enable grouped: change `DISABLED_VIEW_MODES` in `buyer-browse-client.tsx`
   - **Flat View Features**:
     - Sortable columns (click header to sort): Make, Year, Mileage, Price
     - Checkbox selection per row + "Select All" header
     - Individual "Add to Cart" button per row
     - Bulk "Add X to Cart" floating action bar when items selected
     - "In Cart" badge and disabled button for items already in cart
     - Click row to navigate to vehicle detail page
     - Pagination (50 items per page)
   - Grouping parameter selector (Make, Model, Variant, Year, Color, Condition, Body Type)
   - Grouped listings showing unit count, price range, mileage range
   - Vehicles without price display as "RFQ" (Request for Quote)
   - Incoterm badge (FOB/CIF) displayed next to prices on all buyer pages
   - Expand groups to see individual vehicles
   - Individual vehicle rows show Make, Model, Year with variant in parentheses
   - Clickable vehicle rows navigate to detail page
   - Select individual vehicles or "Select All" within group
   - Bulk add to cart from groups with visual feedback (green button + "Added X to Cart!")
   - Cart duplicate awareness:
     - "X in cart" badge on grouped listing cards showing vehicles already in cart
     - "Select All (X already in cart)" indicator in expanded vehicle list
     - "In Cart" badge with shopping cart icon on individual vehicle rows
     - Enhanced add-to-cart feedback: "Added X (Y already in cart)" message
   - Grouping preference saved to localStorage
   - URL-based state for shareable/bookmarkable views
   - Vehicle detail page with full specifications
   - Cart persists in localStorage
   - Cart groups items by seller
   - Add/remove from cart working
   - **Search & Filters (P2 Complete)**:
     - Collapsible filter panel with compact grid layout (2 cols mobile, 4 cols desktop)
     - Keyword search (debounced 300ms) by make/model
     - Price range filter (min/max)
     - Year range filter (min/max)
     - Mileage range filter (min/max)
     - Country dropdown filter
     - Condition dropdown filter
     - Body Type dropdown filter
     - Fuel Type dropdown filter
     - Transmission dropdown filter
     - Filter count badge and "Clear All" button
     - URL sync for shareable/bookmarkable filtered views

5. **Shared Components**
   - Header with role-based navigation
   - Cart badge with item count
   - Mobile responsive navigation

8. **Inspection Report Feature**
   - Scrapes Chinese inspection reports (Chaboshi 查博士) using Puppeteer + OpenAI
   - **Puppeteer-core** renders JavaScript-heavy Vue.js pages before extraction
   - GPT-4o-mini parses rendered HTML content and extracts: grade (A-E), scores, conclusions
   - Results cached in InspectionReport database table
   - Validation prevents saving if OpenAI fails to extract required data (overallGrade)
   - Clean UI with grade letter, green checkmarks for "No Damage" status
   - "View Full Report" button links to original Chinese report
   - API: GET/POST /api/inspection/[vehicleId]

7. **Design System (AD Ports Refresh)**
   - Dark navy primary color (#1e293b via oklch)
   - Teal stock badges for unit counts
   - Green success badges for published status
   - Clean card shadows and refined borders
   - Polished filter bar and navigation

6. **Seller Inventory Management (Phase 3 Complete + Edit)**
   - Inventory list page at `/seller/inventory`
   - Table with: Checkbox, Image, Make/Model, Year, Price, VIN, Status, Actions
   - Filter by status (All, Draft, Published, Sold)
   - Search by make, model, or VIN (debounced)
   - Pagination (50 items per page) with URL params
   - Status toggle button (Publish/Unpublish) per vehicle
   - Delete single vehicle with confirmation dialog
   - Bulk selection with checkbox (select all / individual)
   - Bulk actions: Publish, Unpublish, Delete selected
   - **Edit vehicle page** at `/seller/vehicle/[id]/edit`:
     - All fields editable in organized sections (Basic Info, Specifications, Engine, Details, Location, Pricing, Additional)
     - Client-side validation for required fields
     - Server-side validation with VIN uniqueness check
     - Price/currency/incoterm relationship validation
     - Success redirect to inventory after save
   - **Image upload** using Supabase Storage:
     - Drag-and-drop dropzone on edit page
     - Multiple file upload with progress indicators
     - Set primary image functionality
     - Delete images (removes from storage + database)
     - Image grid preview with reorder capability (primary shown first)

9. **Negotiation Module (Complete)**
   - Seller-level deal rooms for price/terms negotiation
   - Cart page updated with per-seller "Negotiate" button
   - **Full-Page Negotiation UI** (converted from modal for better UX):
     - Two-column layout: Terms (left) + Chat (right)
     - Vehicle list with images, system price, offer input
     - Savings calculation per vehicle
     - Incoterm toggle (FOB/CIF)
     - Deposit % selection (10%/20%/30%)
     - Summary box: System Total, Negotiated Deal, Token Due Now, Final Balance
   - **Chat Panel**:
     - Message thread with sender role and timestamp
     - Manual refresh button
     - Buyer/Seller status indicators
   - **Workflow States**:
     - DRAFT: Buyer can edit terms
     - BUYER_FINALIZED: Buyer locked terms, awaiting seller
     - SELLER_APPROVED: Ready for checkout → redirects to Deals page
   - **Performance Optimizations**:
     - Added sellerId filter to negotiations API for faster lookups
     - Added minimal=true option for lightweight queries
     - Added composite index on (buyerId, sellerId)
     - Fixed infinite re-render issues with useRef initialization
   - **Add Items to Existing Negotiation**:
     - POST /api/negotiations/[id]/items adds new cart items to DRAFT negotiation
     - Auto-detects new cart items when opening negotiation page
   - **Seller Negotiations Page**:
     - List of incoming negotiations with status badges
     - Summary cards for pending/awaiting/approved counts
     - Click to open full-page negotiation view
   - **Database Models**: Negotiation, NegotiationItem, NegotiationMessage
   - **API Routes**:
     - POST/GET /api/negotiations (with sellerId, minimal, status filters)
     - GET/PATCH /api/negotiations/[id]
     - POST /api/negotiations/[id]/items (add items to negotiation)
     - POST /api/negotiations/[id]/finalize
     - POST /api/negotiations/[id]/approve
     - GET/POST /api/negotiations/[id]/messages

10. **Approved Deals Page (NEW)**
    - `/buyer/deals` - Lists all SELLER_APPROVED negotiations
    - `/buyer/deals/[id]` - Individual deal detail view (read-only)
    - Shows vehicles, final prices, terms, message history
    - "Proceed to Checkout" button (placeholder for checkout flow)
    - **Auto-Cart Clearing**: When negotiation approved, items removed from cart
    - **Navigation**: "Deals" link added to buyer header
    - **Approved Deals Banner**: Shows on negotiate page if approved deals exist with seller

---

## Fuzzy Matching Implementation (Ready to Integrate)

### Files Created This Session

| File | Destination | Action |
|------|-------------|--------|
| `upload-page-with-fuzzy.tsx` | `src/app/seller/upload/page.tsx` | **REPLACE** |
| `upload-types-additions.ts` | `src/types/upload.ts` | **APPEND** |
| `fuzzy-matcher.ts` | `src/lib/fuzzy-matcher.ts` | **CREATE** |
| `fuzzy-match-review.tsx` | `src/components/seller/fuzzy-match-review.tsx` | **CREATE** |
| `validate-fuzzy-route.ts` | `src/app/api/upload/validate-fuzzy/route.ts` | **CREATE** |
| `prisma-schema-addition.prisma` | `prisma/schema.prisma` | **APPEND** |
| `seed-master-data.ts` | `prisma/seed-master-data.ts` | **CREATE** |
| `sample-master-vehicle-data.xlsx` | `prisma/data/master-vehicle-data.xlsx` | **CREATE** |

### New Upload Flow (4 Steps)

```
BEFORE: Upload → Map Columns → Import (3 steps)
AFTER:  Upload → Map Columns → Review Matches → Import (4 steps)
                                    ↑
                               NEW STEP
```

### Fuzzy Matching Thresholds

| Confidence | Status | Action |
|------------|--------|--------|
| 100% | Exact Match | Pass through |
| 90-99% | Auto-Corrected | Silently fixed |
| 70-89% | Needs Review | User confirms |
| <70% | No Match | Cannot import |

### Database Model to Add

```prisma
model MasterVehicleData {
  id        String   @id @default(cuid())
  make      String
  model     String
  variant   String
  
  @@unique([make, model, variant])
  @@index([make])
  @@index([make, model])
}
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (vehicle images)
- **State**: Zustand (cart), React state (forms)
- **Excel Parsing**: xlsx library
- **Inspection Scraping**: Puppeteer-core + OpenAI GPT-4o-mini
- **Deployment**: Vercel

---

## Key Files and Directories

```
src/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   ├── validate/route.ts   # POST validation endpoint
│   │   │   └── import/route.ts     # POST import endpoint
│   │   ├── seller/
│   │   │   └── vehicles/
│   │   │       ├── route.ts        # GET list vehicles with filters/pagination
│   │   │       ├── [id]/
│   │   │       │   ├── route.ts    # PATCH (status OR full update) / DELETE single vehicle
│   │   │       │   └── images/
│   │   │       │       ├── route.ts       # NEW: POST upload / GET list images
│   │   │       │       └── [imageId]/route.ts # NEW: PATCH set primary / DELETE image
│   │   │       └── bulk/route.ts   # POST bulk actions
│   │   └── vehicles/
│   │       ├── grouped/route.ts    # NEW: POST dynamic grouping endpoint
│   │       └── by-ids/route.ts     # NEW: POST fetch vehicles by IDs
│   ├── seller/
│   │   ├── layout.tsx              # Seller sidebar layout
│   │   ├── page.tsx                # Seller dashboard
│   │   ├── upload/
│   │   │   └── page.tsx            # Full 3-step wizard with validation & import
│   │   ├── inventory/
│   │   │   └── page.tsx            # Inventory management page
│   │   └── vehicle/
│   │       └── [id]/
│   │           └── edit/page.tsx   # NEW: Edit vehicle page
│   └── buyer/
│       ├── layout.tsx              # Buyer layout
│       ├── page.tsx                # Browse vehicles
│       ├── cart/page.tsx           # Shopping cart
│       └── vehicle/[id]/page.tsx   # Vehicle detail
├── components/
│   ├── seller/
│   │   ├── upload-dropzone.tsx     # File dropzone with validation
│   │   ├── data-preview.tsx        # Table showing first 5 rows
│   │   ├── column-mapper.tsx       # Mapping interface + pricing section
│   │   ├── validation-errors.tsx   # Error list grouped by row
│   │   ├── import-progress.tsx     # Progress indicator
│   │   ├── import-summary.tsx      # Success/error summary
│   │   ├── vehicle-form.tsx        # Full edit form with sections
│   │   └── vehicle-image-upload.tsx # NEW: Image upload component
│   ├── buyer/
│   │   ├── grouping-selector.tsx   # Parameter checkbox selector
│   │   ├── grouped-listing-card.tsx # Card for grouped vehicles (shows in-cart badge)
│   │   ├── vehicle-selection-list.tsx # Expandable list within group (clickable rows)
│   │   ├── buyer-browse-client.tsx # Client wrapper for browse page
│   │   └── search-filters.tsx      # Collapsible filter panel with all filters
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   ├── validate/route.ts   # POST validation endpoint
│   │   │   └── import/route.ts     # POST import endpoint
│   │   ├── negotiations/
│   │   │   ├── route.ts            # POST create / GET list negotiations
│   │   │   └── [id]/
│   │   │       ├── route.ts        # GET / PATCH negotiation
│   │   │       ├── items/route.ts  # POST add items to negotiation
│   │   │       ├── finalize/route.ts  # POST buyer finalize
│   │   │       ├── approve/route.ts   # POST seller approve
│   │   │       └── messages/route.ts  # GET / POST messages
│   │   ├── seller/
│   │   │   └── vehicles/
│   │   │       ├── route.ts        # GET list vehicles with filters/pagination
│   │   │       ├── [id]/
│   │   │       │   ├── route.ts    # PATCH (status OR full update) / DELETE single vehicle
│   │   │       │   └── images/
│   │   │       │       ├── route.ts       # POST upload / GET list images
│   │   │       │       └── [imageId]/route.ts # PATCH set primary / DELETE image
│   │   │       └── bulk/route.ts   # POST bulk actions
│   │   └── vehicles/
│   │       ├── grouped/route.ts    # POST dynamic grouping endpoint
│   │       └── by-ids/route.ts     # POST fetch vehicles by IDs
│   ├── seller/
│   │   ├── layout.tsx              # Seller sidebar layout
│   │   ├── page.tsx                # Seller dashboard
│   │   ├── upload/
│   │   │   └── page.tsx            # Full 3-step wizard with validation & import
│   │   ├── inventory/
│   │   │   └── page.tsx            # Inventory management page
│   │   ├── negotiations/
│   │   │   ├── page.tsx            # Seller negotiations list
│   │   │   └── [id]/page.tsx       # Seller negotiation detail
│   │   └── vehicle/
│   │       └── [id]/
│   │           └── edit/page.tsx   # Edit vehicle page
│   └── buyer/
│       ├── layout.tsx              # Buyer layout
│       ├── page.tsx                # Browse vehicles
│       ├── cart/page.tsx           # Shopping cart
│       ├── vehicle/[id]/page.tsx   # Vehicle detail
│       ├── negotiate/
│       │   └── [sellerId]/page.tsx # Negotiation page (full-page)
│       └── deals/
│           ├── page.tsx            # Approved deals list
│           └── [id]/page.tsx       # Deal detail (read-only)
```

### Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=https://xnfljhbehrkaqiwkhfzc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Connect to Supabase via connection pooling
DATABASE_URL=postgresql://postgres.xnfljhbehrkaqiwkhfzc:PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection to the database. Used for migrations
DIRECT_URL=postgresql://postgres.xnfljhbehrkaqiwkhfzc:PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

OPENAI_API_KEY=your_openai_key_here
```

**⚠️ Important for Vercel**: When adding env vars in Vercel dashboard, do NOT include quotes around values. Local `.env` files can have quotes, but Vercel UI expects raw values.

---

## Known Issues

1. **Signout redirect**: Redirects to Supabase URL instead of /login (low priority)
2. **Large file uploads**: May time out for files with 10,000+ rows (consider chunking)

---

## Important Business Context

1. **Sellers are Chinese car exporters**: They have their own Excel formats with Chinese column names
2. **Column mapping for uploads**: Sellers have different Excel formats, so we provide a mapping UI
3. **Cart supports multiple sellers**: Buyers can add cars from different sellers to one cart
4. **Price shown as range**: Groups show min-max price with option to see per-unit
5. **Zustand + localStorage for cart**: Fast local updates, persists across refreshes
6. **Supabase for auth + storage**: Unified platform for MVP
7. **Client-side Excel parsing**: Using xlsx library in browser for immediate feedback
8. **Fuzzy matching for data quality**: Sellers may have typos in Make/Model/Variant - fuzzy matching validates against master data

---

## User Flows Summary

### Seller Flow
1. ✅ Register as seller (with company details)
2. ✅ View dashboard
3. ✅ Upload Excel → Map columns → Validate → Import (P0+P1+P2 complete)
4. ✅ Manage inventory (list/filter/search/publish/delete) - Phase 3 complete
5. ✅ Edit vehicle details - Phase 3 P3 complete
6. ⏳ View orders

### Buyer Flow
1. ✅ Register as buyer
2. ✅ Browse vehicles with dynamic grouping
3. ✅ Select grouping parameters (Make, Model, Year, etc.)
4. ✅ Browse grouped listings (expand to see individual vehicles)
5. ✅ Bulk select vehicles from groups
6. ✅ View vehicle details
7. ✅ Add to cart (single or bulk)
8. ✅ View cart
9. ⏳ Checkout

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

### Dynamic Grouping API
```typescript
// Fetch grouped listings with filters
const response = await fetch('/api/vehicles/grouped', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    groupBy: ['make', 'model', 'year'],
    filters: {
      minPrice: 10000,
      maxPrice: 50000,
      minYear: 2018,
      maxYear: 2024,
      minMileage: 0,
      maxMileage: 100000,
      country: 'United Arab Emirates', // Full country name for ILIKE match
      condition: 'GOOD',      // Enum value (EXCELLENT, GOOD, FAIR, POOR)
      bodyType: 'SEDAN',      // Enum value (SEDAN, SUV, etc.)
      fuelType: 'DIESEL',     // Enum value (PETROL, DIESEL, etc.)
      transmission: 'AUTOMATIC', // Enum value (AUTOMATIC, MANUAL, etc.)
    },
    page: 1,
    limit: 20,
  }),
});
const { listings, pagination, totalVehicles } = await response.json();

// Fetch vehicles by IDs (for group expansion)
const vehiclesResponse = await fetch('/api/vehicles/by-ids', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vehicleIds: ['id1', 'id2'] }),
});
const vehicles = await vehiclesResponse.json();
```

### Inspection Report API
```typescript
// Fetch inspection report (cached or fresh)
const response = await fetch(`/api/inspection/${vehicleId}`);
const result = await response.json();
// result = { success: boolean, data: InspectionReportData | null, error?: string }

// Force re-scrape
const refreshResponse = await fetch(`/api/inspection/${vehicleId}`, { method: 'POST' });
```

### Fuzzy Matching API (NEW - Ready to Implement)
```typescript
// Validate Make/Model/Variant against master data
const response = await fetch('/api/upload/validate-fuzzy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vehicles: [
      { rowIndex: 0, make: 'Honds', model: 'Acord', variant: 'EX' },
      { rowIndex: 1, make: 'Toyota', model: 'Camry', variant: 'LE' },
    ],
  }),
});
const { summary, results } = await response.json();
// summary = { total: 2, valid: 1, needsReview: 1, invalid: 0 }
// results = VehicleMMVValidation[]
```

---

## Next Session Should Focus On

**Priority 1: Checkout Flow (Phase 5)**
- Checkout page for approved deals
- Payment summary with token due vs final balance
- Contact/notes field
- Submit order (create order from approved negotiation)
- Order confirmation page
- Link from `/buyer/deals/[id]` "Proceed to Checkout" button

**Priority 2: Implement Fuzzy Matching**
- Copy files from previous session's outputs to project
- Run Prisma migration for MasterVehicleData model
- Seed master data from Excel file
- Test upload flow with 4-step wizard
- Note: VIN duplicate validation is now complete and integrated

**Priority 3: Save/Load Column Mappings**
- API routes: GET/POST/DELETE /api/mappings
- Save mapping with custom name
- Load saved mappings dropdown
- Set default mapping option

**Priority 4: Order Management**
- Buyer order history
- Seller incoming orders view
- Order status updates

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
- **Fuzzy matching files are ready in outputs** - just need to copy and integrate
