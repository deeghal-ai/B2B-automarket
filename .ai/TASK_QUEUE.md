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

## Current Sprint: Phase 2 - Seller Upload

### P0 - In Progress
- [ ] Create upload page UI (`/seller/upload`)
- [ ] File drop zone component for Excel/CSV
- [ ] Parse Excel using `xlsx` library
- [ ] Preview first 5 rows of data

### P1 - Up Next
- [ ] Column mapping interface:
  - [ ] Show detected columns from Excel
  - [ ] Dropdown to map each to our fields
  - [ ] Mark required fields with asterisk
  - [ ] Auto-detect common column names
- [ ] Validation logic:
  - [ ] Check required fields are mapped
  - [ ] Validate data types (year, price, VIN format)
  - [ ] Show row-by-row errors
- [ ] Save column mapping:
  - [ ] Save mapping with custom name
  - [ ] Set default mapping option
  - [ ] Load saved mappings dropdown

### P2 - This Sprint
- [ ] Import functionality:
  - [ ] Bulk insert to database
  - [ ] Progress indicator
  - [ ] Skip invalid rows option
  - [ ] Success/error summary
- [ ] API endpoints:
  - [ ] POST /api/upload/parse
  - [ ] POST /api/upload/validate
  - [ ] POST /api/upload/import
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
| Next session | Seller Upload | Pending |