# Architecture Specification

## System Overview

B2B Auto Marketplace connecting UAE car dealers (buyers) with Chinese used car sellers. Enables bulk purchase through dynamic vehicle grouping.

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                     (Next.js App Router)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Seller    │  │    Buyer     │  │    Shared    │          │
│  │  Dashboard   │  │   Browse     │  │   (Auth,     │          │
│  │  - Upload    │  │   - Group    │  │    Header)   │          │
│  │  - Inventory │  │   - Detail   │  │              │          │
│  │              │  │   - Cart     │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API ROUTES                                 │
│                  (Next.js Route Handlers)                        │
│  /api/auth/*  /api/vehicles/*  /api/upload/*  /api/cart/*      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────────┐           ┌──────────────────┐           │
│  │  Prisma ORM      │           │  Supabase        │           │
│  │  - Type-safe     │◄─────────►│  - PostgreSQL    │           │
│  │  - Migrations    │           │  - Auth          │           │
│  │                  │           │  - Storage       │           │
│  └──────────────────┘           └──────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Language | TypeScript | Type safety |
| Database | PostgreSQL (Supabase) | Relational data, complex queries |
| ORM | Prisma | Type-safe database access |
| Auth | Supabase Auth | Email/password authentication |
| Storage | Supabase Storage | Vehicle images |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | Shadcn/UI | Accessible, customizable components |
| State | Zustand | Client-side state (cart) |
| Data Fetching | TanStack Query | Server state, caching |
| Excel Parsing | xlsx | Parse seller uploads |
| Deployment | Vercel | Hosting |

## Directory Structure

```
b2b-auto-marketplace/
├── .ai/                          # AI context files
│   ├── CONTEXT.md
│   ├── DECISIONS.md
│   ├── TASK_QUEUE.md
│   └── PROMPTS.md
├── specs/                        # Feature specifications
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   └── features/
├── prisma/
│   └── schema.prisma
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   ├── globals.css
│   │   ├── (auth)/              # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── seller/              # Seller routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── upload/
│   │   │   └── inventory/
│   │   ├── buyer/               # Buyer routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Browse with grouping
│   │   │   ├── vehicle/[id]/
│   │   │   └── cart/
│   │   └── api/                 # API routes
│   │       ├── auth/
│   │       ├── vehicles/
│   │       ├── upload/
│   │       └── cart/
│   ├── components/
│   │   ├── ui/                  # Shadcn components
│   │   ├── seller/
│   │   │   ├── upload-dropzone.tsx
│   │   │   ├── column-mapper.tsx
│   │   │   └── inventory-table.tsx
│   │   ├── buyer/
│   │   │   ├── grouping-selector.tsx
│   │   │   ├── grouped-listing-card.tsx
│   │   │   ├── vehicle-card.tsx
│   │   │   └── cart-item.tsx
│   │   └── shared/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── loading.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client
│   │   │   └── server.ts        # Server client
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── utils.ts             # Utility functions
│   │   └── constants.ts         # App constants
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   └── use-vehicles.ts
│   ├── stores/
│   │   └── cart-store.ts        # Zustand cart store
│   └── types/
│       └── index.ts             # Shared types
├── .env.local                   # Environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Key Patterns

### API Route Pattern
```typescript
// src/app/api/vehicles/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const vehicles = await prisma.vehicle.findMany();
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
```

### Server Component Data Fetching
```typescript
// src/app/buyer/page.tsx
import { prisma } from '@/lib/prisma';

export default async function BuyerPage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { status: 'PUBLISHED' }
  });
  
  return <VehicleList vehicles={vehicles} />;
}
```

### Client Component with Zustand
```typescript
// src/components/buyer/add-to-cart-button.tsx
'use client';

import { useCartStore } from '@/stores/cart-store';

export function AddToCartButton({ vehicle }) {
  const addItem = useCartStore((state) => state.addItem);
  
  return (
    <button onClick={() => addItem(vehicle)}>
      Add to Cart
    </button>
  );
}
```

## Authentication Flow

1. User visits `/register` or `/login`
2. Supabase Auth handles authentication
3. On success, user info stored in `users` table via Prisma
4. Role (BUYER/SELLER) determines route access
5. Middleware protects routes based on role

## Data Flow for Dynamic Grouping

```
1. Buyer selects grouping params → [make, model, year]
                    │
                    ▼
2. API builds dynamic query:
   SELECT seller_id, make, model, year,
          COUNT(*), MIN(price), MAX(price),
          ARRAY_AGG(id)
   FROM vehicles
   GROUP BY seller_id, make, model, year
                    │
                    ▼
3. Return grouped results to frontend
                    │
                    ▼
4. Render GroupedListingCard for each group
                    │
                    ▼
5. User expands → Fetch individual vehicles by IDs
                    │
                    ▼
6. User selects vehicles → Add to cart store
```

## Security Considerations

- All API routes validate authentication
- Seller routes verify user owns the resource
- Input validation on all forms
- SQL injection prevented by Prisma parameterization
- CORS handled by Next.js defaults
- Environment variables for secrets

## Performance Considerations

- Database indexes on grouping fields
- Pagination for large result sets
- Image optimization via Next.js Image
- React Server Components for initial load
- Client-side caching with TanStack Query

