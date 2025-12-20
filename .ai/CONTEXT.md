# AI Context File - B2B Auto Marketplace

> **IMPORTANT**: Update this file at the END of every coding session!
> This file helps the next AI session understand the current state of the project.

---

## Project Overview

A B2B marketplace for UAE car dealers to bulk-purchase used cars from China. The core innovation is **dynamic grouping** - buyers can select which parameters to group cars by, enabling efficient bulk selection.

## Current State

**Last Updated**: December 20, 2024
**Last Session Focus**: Foundation setup - Auth, layouts, basic pages
**Current Phase**: Phase 1 Complete ✅ → Ready for Phase 2 (Seller Upload)

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
- [ ] Seller upload with column mapping
- [ ] Seller inventory management
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

3. **Buyer Features**
   - Browse page shows all published vehicles
   - Vehicle detail page with full specifications
   - Cart persists in localStorage
   - Cart groups items by seller
   - Add/remove from cart working

4. **Shared Components**
   - Header with role-based navigation
   - Cart badge with item count
   - Mobile responsive navigation

### What's Broken / Known Issues

- Sign out redirect URL may need adjustment (currently redirects to Supabase URL)
- No vehicles in database yet (need seller upload first)
- Dynamic grouping not implemented yet (showing flat list)

---

## Technical Context

### Database
- **Provider**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Schema Status**: ✅ Deployed and working

### Key Files Modified Recently

```
src/
├── middleware.ts                    # Auth middleware
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── utils.ts                    # Utility functions + enum labels
│   └── supabase/
│       ├── client.ts               # Browser Supabase client
│       ├── server.ts               # Server Supabase client
│       └── middleware.ts           # Session refresh logic
├── types/index.ts                  # All TypeScript types
├── stores/cart-store.ts            # Zustand cart store
├── components/
│   ├── shared/
│   │   ├── header.tsx              # Main header with nav
│   │   └── cart-badge.tsx          # Cart icon with count
│   └── buyer/
│       └── add-to-cart-button.tsx  # Add to cart button
├── app/
│   ├── layout.tsx                  # Root layout with header
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Login page
│   ├── register/page.tsx           # Register with role selection
│   ├── api/auth/
│   │   ├── register/route.ts       # Create user in DB
│   │   └── signout/route.ts        # Sign out
│   ├── seller/
│   │   ├── layout.tsx              # Seller sidebar layout
│   │   └── page.tsx                # Seller dashboard
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

---

## User Flows Summary

### Seller Flow
1. ✅ Register as seller (with company details)
2. ✅ View dashboard
3. ⏳ Upload Excel → Map columns → Import
4. ⏳ Manage inventory (edit/publish/draft)
5. ⏳ View orders

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

---

## Next Session Should Focus On

**Priority 1: Seller Excel Upload with Column Mapping**
- This unlocks the entire marketplace (can't buy without inventory)
- Spec file: `specs/features/seller-upload.md`
- Key components: UploadDropzone, ColumnMapper, ImportProgress

**Priority 2: Seller Inventory Management**
- List, edit, publish/unpublish vehicles
- Spec file: `specs/features/seller-inventory.md`

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