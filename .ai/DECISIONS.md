# Architecture Decisions Log

> Document important decisions here with rationale. Helps future sessions understand WHY things are the way they are.

---

## Decision Template

```
### [DECISION-XXX] Title
**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated
**Context**: What's the situation?
**Decision**: What did we decide?
**Rationale**: Why this choice?
**Consequences**: What are the trade-offs?
```

---

## Accepted Decisions

### [DECISION-001] Per-Seller Grouping Only
**Date**: 2024-12-20
**Status**: Accepted
**Context**: Should vehicle grouping allow cross-seller groups, or only within a seller's inventory?
**Decision**: Groups are always within a single seller's inventory.
**Rationale**: 
- Simplifies checkout (one seller = one shipment/transaction)
- Clearer pricing (seller sets their prices)
- Easier logistics (bulk purchase from one source)
- Matches how B2B car deals typically work
**Consequences**: 
- Buyers can't create a "wishlist" group across sellers
- May need to add cross-seller comparison later

---

### [DECISION-002] Excel Column Mapping vs Fixed Template
**Date**: 2024-12-20
**Status**: Accepted
**Context**: Sellers have different Excel formats. Should we force them to use our template, or let them map their columns?
**Decision**: Provide a column mapping interface.
**Rationale**:
- Sellers already have their data in their own formats
- Reduces friction for onboarding
- More professional B2B experience
- Can save mappings for repeat uploads
**Consequences**:
- More complex upload flow
- Need to handle edge cases (missing data, wrong formats)
- Worth the UX investment for B2B

---

### [DECISION-003] Supabase for MVP
**Date**: 2024-12-20
**Status**: Accepted
**Context**: What database/backend to use?
**Decision**: Supabase (hosted PostgreSQL) + Prisma ORM
**Rationale**:
- Free tier sufficient for MVP
- PostgreSQL handles complex grouping queries
- Built-in auth
- Storage for images
- Can migrate to dedicated Postgres later
**Consequences**:
- Vendor dependency for MVP
- Easy path to self-hosted if needed

---

### [DECISION-004] Inquiry-Based Checkout for MVP
**Date**: 2024-12-20
**Status**: Accepted
**Context**: Should MVP have full payment integration?
**Decision**: No. MVP uses inquiry-based checkout (submit order request).
**Rationale**:
- B2B deals often negotiate offline
- Payment for cars is complex (LCs, wire transfers)
- Faster to MVP without payment integration
- Can add payments in v2
**Consequences**:
- Need manual order fulfillment process
- Less "automated" feel
- Appropriate for B2B context

---

### [DECISION-005] Dynamic SQL for Grouping
**Date**: 2024-12-20
**Status**: Accepted
**Context**: How to implement dynamic grouping by user-selected parameters?
**Decision**: Build dynamic SQL GROUP BY queries based on selected fields.
**Rationale**:
- Most flexible approach
- PostgreSQL handles this efficiently
- Alternatives (materialized views, pre-computed groups) add complexity
**Consequences**:
- Need to be careful about SQL injection (use parameterized field lists)
- Query performance depends on indexes
- Will add indexes on common grouping fields

---

### [DECISION-006] Cart State Management
**Date**: 2024-12-20
**Status**: Accepted
**Context**: Where to store cart state?
**Decision**: Zustand store + localStorage for persistence, sync to DB on checkout.
**Rationale**:
- Fast local updates
- Survives page refresh
- Don't need real-time sync for MVP
- Simple implementation
**Consequences**:
- Cart lost if user switches devices (acceptable for MVP)
- Can add DB sync later for cross-device

---

### [DECISION-007] Supabase SSR Package for Auth
**Date**: 2024-12-20
**Status**: Accepted
**Context**: Which Supabase package to use for Next.js 14 App Router?
**Decision**: Use `@supabase/ssr` package with separate client/server utilities.
**Rationale**:
- Official package for SSR frameworks
- Proper cookie handling for App Router
- Works with middleware for session refresh
- Replaced deprecated `@supabase/auth-helpers-nextjs`
**Consequences**:
- Need separate client.ts and server.ts files
- Middleware required for session refresh

---

### [DECISION-008] Role-Based Routing via Middleware
**Date**: 2024-12-20
**Status**: Accepted
**Context**: How to protect routes based on user role (buyer/seller)?
**Decision**: Use Next.js middleware to check auth and redirect appropriately.
**Rationale**:
- Runs before page renders (fast)
- Centralized auth logic
- Can check both auth status and user role
- Works with Supabase session refresh
**Consequences**:
- Need to be careful about performance (runs on every request)
- Complex role checks should happen in page components

---

### [DECISION-009] Prisma for Database Access
**Date**: 2024-12-20
**Status**: Accepted
**Context**: Should we use Prisma or Supabase client for database queries?
**Decision**: Use Prisma for all database operations.
**Rationale**:
- Type-safe queries
- Better migration support
- AI tools understand Prisma well
- Consistent patterns across codebase
- Raw SQL available when needed ($queryRawUnsafe for grouping)
**Consequences**:
- Supabase client only used for auth and storage
- Need to keep Prisma schema in sync with Supabase

---

### [DECISION-010] Server Components by Default
**Date**: 2024-12-20
**Status**: Accepted
**Context**: When to use Server vs Client components?
**Decision**: Server components by default, Client only when needed.
**Rationale**:
- Better performance (less JS shipped)
- Direct database access in components
- Follows Next.js 14 best practices
- Client components for: interactivity, hooks, browser APIs
**Consequences**:
- Need 'use client' directive for interactive components
- Some prop drilling needed for server → client data

---

## Proposed Decisions

(Add decisions under discussion here)

*None pending*

---

## Deprecated Decisions

(Move old decisions here if we change approach)

*None yet*