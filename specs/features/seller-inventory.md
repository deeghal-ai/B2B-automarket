# Feature Spec: Seller Inventory Management

## Overview

After uploading vehicles, sellers need to view, edit, publish/unpublish, and manage their inventory.

## User Stories

### US-1: View Inventory List
**As a** seller
**I want to** see all my vehicles in a table
**So that** I can manage my inventory

**Acceptance Criteria:**
- Table with key columns: Image, Make/Model, Year, Price, Status, Actions
- Filter by status (Draft, Published, Sold)
- Search by make, model, VIN
- Pagination (50 items per page)
- Sort by date added, price, make

### US-2: Edit Vehicle
**As a** seller
**I want to** edit vehicle details
**So that** I can correct errors or update information

**Acceptance Criteria:**
- Click to open edit modal/page
- All fields editable
- Validate before saving
- Show success/error feedback

### US-3: Publish/Unpublish
**As a** seller
**I want to** control which vehicles are visible to buyers
**So that** I can manage availability

**Acceptance Criteria:**
- Toggle switch or buttons
- Bulk publish/unpublish
- Confirmation for bulk actions

### US-4: Delete Vehicles
**As a** seller
**I want to** remove vehicles from my inventory
**So that** I can clean up sold or unavailable items

**Acceptance Criteria:**
- Delete single or bulk
- Confirmation dialog
- Soft delete (keep for records) or hard delete

## UI Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📦 Inventory Management                              [+ Upload More]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filters:                                                               │
│  Status: [All ▼]  Search: [________________🔍]                         │
│                                                                         │
│  ☐ Select All                         Showing 1-50 of 238 vehicles     │
│  ─────────────────────────────────────────────────────────────────────  │
│  ☐ │ 📷 │ Toyota Camry LE    │ 2022 │ $18,500 │ ● Published │ [Edit] │  │
│  ☐ │ 📷 │ Toyota Camry SE    │ 2022 │ $19,200 │ ○ Draft     │ [Edit] │  │
│  ☐ │ 📷 │ Honda Accord Sport │ 2022 │ $21,000 │ ● Published │ [Edit] │  │
│  ...                                                                    │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  With selected (3):  [Publish] [Unpublish] [Delete]                    │
│                                                                         │
│  [← Previous]  Page 1 of 5  [Next →]                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Files to Create

```
src/
├── app/
│   └── seller/
│       ├── inventory/
│       │   └── page.tsx
│       └── vehicle/
│           └── [id]/
│               └── edit/page.tsx
└── components/
    └── seller/
        ├── inventory-table.tsx
        ├── vehicle-row.tsx
        ├── vehicle-edit-form.tsx
        ├── status-toggle.tsx
        └── bulk-actions.tsx
```

## API Endpoints

```
GET    /api/seller/vehicles          # List with filters
GET    /api/seller/vehicles/:id      # Single vehicle
PUT    /api/seller/vehicles/:id      # Update vehicle
DELETE /api/seller/vehicles/:id      # Delete vehicle
POST   /api/seller/vehicles/bulk     # Bulk status update
```
