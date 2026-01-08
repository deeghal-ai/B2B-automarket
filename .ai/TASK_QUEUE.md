# Task Queue - B2B Auto Marketplace

> Check off tasks as completed. Add new tasks as discovered.
> Priority: P0 = Do now, P1 = Do next, P2 = Do soon, P3 = Backlog

---

## ✅ Completed: Phase 1 - Foundation

### Database & Auth
- [x] Prisma schema deployed to Supabase
- [x] Prisma client singleton created
- [x] Supabase auth configured (client + server + middleware)
- [x] Register page (with role selection: buyer/seller)
- [x] Login page
- [x] Protected routes working (middleware)
- [x] User profile storage in database
- [x] Sign out functionality
- [x] API route: POST /api/auth/register
- [x] API route: POST /api/auth/signout

### Layouts & Navigation
- [x] Root layout with header integration
- [x] Header component with role-based navigation
- [x] Mobile responsive nav (Sheet component)
- [x] Seller dashboard sidebar layout
- [x] Buyer layout (container wrapper)
- [x] Landing page with hero + features

### Buyer Core (Basic)
- [x] Browse page (flat list - placeholder)
- [x] Vehicle detail page with full specs
- [x] Cart store (Zustand + localStorage)
- [x] Cart page with seller grouping
- [x] Cart badge component
- [x] Add to cart button component

### Seller Core (Basic)
- [x] Seller dashboard with stats
- [x] Quick actions section
- [x] Getting started checklist

---

## ✅ Completed: Phase 2 - Seller Upload

### ✅ P0 - Complete
- [x] Create upload page UI (`/seller/upload`)
- [x] File drop zone component for Excel/CSV
- [x] Parse Excel using `xlsx` library
- [x] Preview first 5 rows of data
- [x] 3-step wizard UI structure

### ✅ P1 - Complete (Column Mapping)
- [x] Column mapping interface:
  - [x] System fields on left, Excel column dropdown on right
  - [x] Dropdown to select Excel column for each field
  - [x] Mark required fields with asterisk
  - [x] Auto-detect common column names (Brand→make, etc.)
  - [x] Prevent duplicate column mappings
  - [x] Validation: block proceeding without required fields
- [x] Required fields reduced to 6: make, model, year, color, variant, condition
- [ ] Save column mapping (UI ready, needs API):
  - [ ] Save mapping with custom name
  - [ ] Set default mapping option
  - [ ] Load saved mappings dropdown

### ✅ P2 - Complete (Validation & Import)
- [x] Row-by-row validation:
  - [x] Validate data types (year, price, mileage)
  - [x] Validate enums (condition, bodyType, fuelType, transmission, drivetrain)
  - [x] Show validation errors with row numbers
  - [x] Auto-skip invalid rows (only valid rows imported)
- [x] Import functionality:
  - [x] Bulk insert to database via Prisma createMany
  - [x] Progress indicator component
  - [x] Success/error summary with actions
  - [x] Import as DRAFT status
  - [x] Skip duplicates (VIN collision handling)
- [x] API endpoints:
  - [x] POST /api/upload/validate
  - [x] POST /api/upload/import
- [ ] Column mapping persistence (moved to P3):
  - [ ] GET /api/mappings
  - [ ] POST /api/mappings
  - [ ] DELETE /api/mappings/:id

---

## ✅ Completed: Phase 3 - Seller Inventory Management

### ✅ P1 - Complete (Inventory List)
- [x] Inventory list page (`/seller/inventory`)
- [x] Table with: Checkbox, Image, Make/Model, Year, Price, VIN, Status, Actions
- [x] Filter by status (All/Draft/Published/Sold)
- [x] Search by make, model, VIN (debounced)
- [x] Pagination (50 items per page, URL-based)
- [x] API endpoint: GET /api/seller/vehicles

### ✅ P2 - Complete (Inventory Actions)
- [x] Status toggle (Publish/Unpublish) per vehicle
- [x] Bulk select + bulk actions (Publish/Unpublish/Delete)
- [x] Delete vehicle (with confirmation dialog)
- [x] API endpoints:
  - [x] PATCH /api/seller/vehicles/[id]
  - [x] DELETE /api/seller/vehicles/[id]
  - [x] POST /api/seller/vehicles/bulk

### ✅ P3 - Complete (Edit Vehicle)
- [x] Edit vehicle page (`/seller/vehicle/[id]/edit`)
- [x] PATCH API supports full vehicle updates
- [x] Edit button in inventory table

### ✅ P4 - Complete (Image Upload)
- [x] Image upload per vehicle (Supabase Storage)
- [x] Set primary image functionality
- [x] Delete images with storage cleanup

---

## ✅ Completed: Phase 4 - Buyer Dynamic Grouping (MVP Core!)

### ✅ P0 - Core Feature (Complete)
- [x] Grouping parameter selector component
  - [x] Checkboxes: Make, Model, Variant, Year, Color, Condition, Body Type
  - [x] Apply Grouping button
  - [x] Save preference to localStorage
- [x] Dynamic grouping API endpoint
  - [x] Build GROUP BY query from selected params
  - [x] Return: count, price range, seller info, vehicle IDs
  - [x] Pagination support
- [x] Grouped listings view
  - [x] Card per group showing summary
  - [x] Seller info on each card
  - [x] Unit count badge
  - [x] Price range display

### ✅ P1 - Group Expansion (Complete)
- [x] Expand group to see individual units
- [x] Show vehicle cards within group (Make, Model, Year + variant)
- [x] Clickable vehicle rows navigate to detail page
- [x] Checkbox selection per vehicle
- [x] "Select All" for group
- [x] Bulk add to cart from group
- [x] Visual feedback when adding to cart (green button + "Added X to Cart!")

### ✅ P2 - Search & Filters (Complete)
- [x] Search by keyword (make, model) - debounced 300ms
- [x] Filter by price range (min/max)
- [x] Filter by year range (min/max)
- [x] Filter by mileage range (min/max)
- [x] Filter by country (ILIKE partial match)
- [x] Filter by condition (enum dropdown)
- [x] Filter by body type (enum dropdown)
- [x] Filter by fuel type (enum dropdown)
- [x] Filter by transmission (enum dropdown)
- [x] Collapsible filter panel with compact grid layout
- [x] URL sync for shareable/bookmarkable filters
- [x] Active filter count badge
- [x] Clear All button

---

## ✅ Completed: Vercel Deployment

### P0 - Production Deployment (Complete)
- [x] Install `@sparticuz/chromium` for serverless Chromium
- [x] Update inspection scraper for Vercel compatibility
- [x] Create `vercel.json` with function config
- [x] Update `next.config.ts` with serverExternalPackages
- [x] Fix `package.json` (postinstall, @prisma/client in deps)
- [x] Fix TypeScript Decimal→number serialization for edit page
- [x] Deploy to Vercel
- [x] Configure environment variables in Vercel dashboard

---

## 🔲 In Progress: Fuzzy Matching for Bulk Upload

### ✅ P0 - Design & Architecture (Complete - Jan 7, 2026)
- [x] Analyze feasibility of fuzzy logic for Make/Model/Variant
- [x] Design 4-step upload wizard (Upload → Map → Review Matches → Import)
- [x] Create fuzzy matching algorithm (Levenshtein distance)
- [x] Define confidence thresholds (90% auto-correct, 70% review, <70% reject)
- [x] Design MasterVehicleData Prisma model
- [x] Create all implementation files (ready to integrate)

### P1 - Implementation (Ready to Start)
Files created, need to copy to project:
- [ ] Add `MasterVehicleData` model to `prisma/schema.prisma`
- [ ] Run Prisma migration: `npx prisma migrate dev --name add_master_vehicle_data`
- [ ] Copy `fuzzy-matcher.ts` to `src/lib/fuzzy-matcher.ts`
- [ ] Copy `fuzzy-match-review.tsx` to `src/components/seller/fuzzy-match-review.tsx`
- [ ] Create `src/app/api/upload/validate-fuzzy/route.ts`
- [ ] Append fuzzy types to `src/types/upload.ts`
- [ ] Replace `src/app/seller/upload/page.tsx` with 4-step version
- [ ] Place master data Excel in `prisma/data/master-vehicle-data.xlsx`
- [ ] Run seed script: `npx ts-node prisma/seed-master-data.ts`
- [ ] Test end-to-end upload flow with typos

### P2 - Polish (After Initial Integration)
- [ ] Admin UI for managing master vehicle data
- [ ] Alias support (e.g., "本田" → "Honda")
- [ ] Bulk upload for master data
- [ ] Analytics: track auto-corrections and rejections

---

## Phase 5: Checkout

### P1 - Basic Checkout
- [ ] Checkout page
- [ ] Order summary by seller
- [ ] Contact/notes field
- [ ] Submit inquiry (create order)
- [ ] Order confirmation page

### P2 - Order Management
- [ ] Buyer: Order history
- [ ] Seller: Incoming orders view
- [ ] Order status updates

---

## Backlog (Post-MVP)

### Nice to Have
- [ ] Email notifications (Resend integration)
- [ ] Saved searches for buyers
- [ ] Favorite vehicles
- [ ] Seller analytics dashboard
- [ ] Bulk edit for sellers
- [ ] Price history
- [ ] Currency conversion (USD/AED/CNY)
- [ ] Chat between buyer/seller
- [ ] Vehicle comparison

### Technical Debt
- [ ] Fix signout redirect URL
- [ ] Add loading states/skeletons
- [ ] Error boundaries
- [ ] Form validation with zod
- [ ] Unit tests for critical paths

---

## Bugs & Issues

| Issue | Priority | Status |
|-------|----------|--------|
| Signout redirects to Supabase URL instead of /login | Low | Open |

---

## Session History

| Date | Focus | Outcome |
|------|-------|---------|
| Dec 20, 2024 | Foundation setup | ✅ Auth, layouts, basic pages complete |
| Dec 20, 2024 | Seller Upload P0 | ✅ Upload page, dropzone, Excel parsing, data preview |
| Dec 20, 2024 | Seller Upload P1 | ✅ Column mapping UI, auto-detect, validation, inverted field→header mapping |
| Dec 20, 2024 | Seller Upload P2 | ✅ Row validation, enum normalization, bulk import, progress UI, summary |
| Dec 20, 2024 | Phase 3 Inventory | ✅ Inventory list, filters, pagination, status toggle, bulk actions, delete |
| Dec 20, 2024 | Phase 4 Grouping | ✅ Dynamic grouping API, grouping UI, grouped listings, group expansion, bulk cart |
| Dec 20, 2024 | Phase 4 UX Polish | ✅ Cart feedback animation, vehicle row details (Make/Model/Year), clickable rows |
| Dec 21, 2024 | Phase 4 P2 Filters | ✅ Search & filters complete: 8 filter types, collapsible panel, URL sync, enum fix |
| Dec 21, 2024 | Upload Pricing Enhancement | ✅ Nullable price (RFQ), incoterm field, inspection link, conditional currency/incoterm UI |
| Dec 22, 2024 | RFQ Display + Condition Aliases | ✅ formatPrice shows "RFQ" for $0, condition accepts A/B/C/D grades |
| Dec 22, 2024 | Incoterm Badge Display | ✅ Incoterm (FOB/CIF) badge shown next to prices on all buyer pages |
| Dec 22, 2024 | Edit Vehicle | ✅ Edit page, form with sections, PATCH API, inventory edit button |
| Dec 22, 2024 | Image Upload | ✅ Supabase Storage upload, set primary, delete, dropzone UI, race condition fix |
| Dec 22, 2024 | AD Ports Design Refresh | ✅ Dark navy buttons, teal stock badges, polished UI - functionality preserved |
| Dec 22, 2024 | Inspection Report Feature | ✅ Puppeteer + OpenAI GPT-4o-mini scraper, InspectionReport model, cached API, green checkmark UI card |
| Dec 22, 2024 | Cart Duplicate Visual Feedback | ✅ "X in cart" badge on cards, "In Cart" badges on vehicle rows, "X already in cart" counter, enhanced add-to-cart messages |
| Dec 22, 2024 | Grouped/Flat View Toggle | ✅ View mode toggle, flat listings API with sorting, table with sortable columns/checkboxes/add-to-cart, URL state |
| Dec 22, 2024 | Inspection Report Bug Fixes | ✅ Fixed Prisma relation syntax, added Puppeteer-core for JS-rendered pages, validation before save |
| Dec 22, 2024 | Vercel Deployment | ✅ @sparticuz/chromium for serverless, vercel.json, env vars, TypeScript fixes, deployed to production |
| Jan 07, 2026 | Fuzzy Matching Design | ✅ Designed fuzzy logic for Make/Model/Variant, created all implementation files, proof of concept tested |
| Next session | Fuzzy Matching Integration | Copy files to project, run migrations, seed master data, test flow |
