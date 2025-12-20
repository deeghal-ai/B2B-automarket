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

## Phase 3: Seller Inventory Management

### P1 - After Upload
- [ ] Inventory list page (`/seller/inventory`)
- [ ] Table with: Image, Make/Model, Year, Price, Status, Actions
- [ ] Filter by status (Draft/Published/Sold)
- [ ] Search by make, model, VIN
- [ ] Pagination (50 items per page)

### P2 - Inventory Actions
- [ ] Edit vehicle modal/page
- [ ] Status toggle (Publish/Unpublish)
- [ ] Bulk select + bulk actions
- [ ] Delete vehicle (with confirmation)
- [ ] Image upload per vehicle (Supabase Storage)

---

## Phase 4: Buyer Dynamic Grouping (MVP Core!)

### P0 - Core Feature
- [ ] Grouping parameter selector component
  - [ ] Checkboxes: Make, Model, Variant, Year, Color, Condition, Body Type
  - [ ] Apply Grouping button
  - [ ] Save preference to localStorage
- [ ] Dynamic grouping API endpoint
  - [ ] Build GROUP BY query from selected params
  - [ ] Return: count, price range, seller info, vehicle IDs
  - [ ] Pagination support
- [ ] Grouped listings view
  - [ ] Card per group showing summary
  - [ ] Seller info on each card
  - [ ] Unit count badge
  - [ ] Price range display

### P1 - Group Expansion
- [ ] Expand group to see individual units
- [ ] Show vehicle cards within group
- [ ] Checkbox selection per vehicle
- [ ] "Select All" for group
- [ ] Bulk add to cart from group

### P2 - Search & Filters
- [ ] Search by keyword (make, model)
- [ ] Filter by price range
- [ ] Filter by year range
- [ ] Filter by mileage range
- [ ] Filter by country

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
| Next session | Phase 3 | Seller inventory management OR buyer dynamic grouping |
