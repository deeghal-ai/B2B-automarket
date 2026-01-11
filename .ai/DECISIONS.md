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

### [DECISION-011] Minimal Required Fields for Upload
**Date**: 2024-12-20
**Status**: Accepted
**Context**: Which fields should be mandatory when importing vehicles via Excel?
**Decision**: Only 6 required fields: make, model, year, color, variant, condition.
**Rationale**:
- Reduces friction for sellers uploading inventory
- These 6 fields are essential for grouping/display
- Other fields (VIN, price, mileage, etc.) can be optional or added later
- Matches typical inventory data sellers have readily available
**Consequences**:
- Some vehicles may have incomplete data (acceptable for MVP)
- Validation/import logic needs to handle missing optional fields

---

### [DECISION-012] Field-to-Column Mapping UI (Inverted)
**Date**: 2024-12-20
**Status**: Accepted
**Context**: How to present the column mapping interface to users?
**Decision**: Show system fields on left with dropdown to select Excel column on right.
**Rationale**:
- More intuitive: "What Excel column contains the Make?"
- Easier to ensure all required fields are mapped
- Visual validation of required vs optional fields
- Alternative (column-first) was confusing in testing
**Consequences**:
- Need to track mappings as VehicleField → ExcelHeader
- Validation checks that all required fields have a mapping

---

### [DECISION-013] Enum Filtering via Text Cast
**Date**: 2024-12-21
**Status**: Accepted
**Context**: PostgreSQL enum filters weren't working in dynamic SQL queries.
**Decision**: Cast enum columns to text for comparison: `v."fuelType"::text = $1`
**Rationale**:
- PostgreSQL enums need explicit casting when comparing with string parameters
- Using `::text` cast ensures reliable string comparison
- Simpler than casting the parameter to enum type
**Consequences**:
- Slightly less efficient than native enum comparison (minimal impact)
- More reliable cross-database compatibility
- All enum filters now work correctly

---

### [DECISION-014] Country Filter Partial Matching
**Date**: 2024-12-21
**Status**: Accepted
**Context**: Country filter wasn't matching because database stores "United Arab Emirates" but dropdown had "UAE".
**Decision**: Use ILIKE with wildcards for country filtering: `v."country" ILIKE '%UAE%'`
**Rationale**:
- More forgiving for user input variations
- Handles both full names and abbreviations
- Consistent with make/model search behavior
**Consequences**:
- May match unintended countries if names overlap (unlikely for countries)
- Better UX than requiring exact matches

---

### [DECISION-015] Nullable Price for RFQ Vehicles
**Date**: 2024-12-21
**Status**: Accepted
**Context**: Should vehicles without a price be stored as $0 or as null?
**Decision**: Store price as NULL for RFQ (Request for Quote) vehicles.
**Rationale**:
- NULL clearly distinguishes "no price set" from "$0"
- Display "RFQ" in UI when price is null
- Aligns with B2B convention where pricing is often negotiated
- Cleaner data model semantics
**Consequences**:
- Schema change required (price Decimal -> Decimal?)
- UI must handle null price display as "RFQ"
- Existing vehicles with price=0 may need migration

---

### [DECISION-016] Conditional Currency/Incoterm Requirements
**Date**: 2024-12-21
**Status**: Accepted
**Context**: When should currency and incoterm be required during upload?
**Decision**: Currency and Incoterm are only required when price column is mapped.
**Rationale**:
- If no price, there's no currency/incoterm context needed
- Reduces friction for sellers who only want to list vehicles for RFQ
- When price IS set, trade terms (incoterm) and currency are essential for B2B
- FOB/CIF are the most common incoterms for international auto trade
**Consequences**:
- UI shows conditional fields based on whether price is mapped
- Validation logic must check this dependency
- Default selection UI (FOB/CIF buttons, currency dropdown) when fields not mapped from Excel

---

### [DECISION-017] Condition Field Accepts Letter Grades
**Date**: 2024-12-22
**Status**: Accepted
**Context**: Sellers from Asian markets (Japan, China) use letter grades (A, B, C, D) for vehicle condition rather than words like "Excellent" or "Good".
**Decision**: Accept letter grades A/B/C/D (with +/- variants) and numeric grades 1-5 as valid condition values.
**Rationale**:
- Common grading system in Asian auto auctions
- Reduces friction for sellers importing from existing inventory systems
- A → EXCELLENT, B → GOOD, C → FAIR, D → POOR
- 1 → EXCELLENT, 2 → GOOD, 3 → FAIR, 4/5 → POOR
**Consequences**:
- Validation is more forgiving
- Sellers don't need to convert their existing data

---

### [DECISION-018] AD Ports Design System Reference
**Date**: 2024-12-22
**Status**: Accepted
**Context**: The default shadcn/ui styling looked generic. User wanted a more professional, polished B2B marketplace aesthetic.
**Decision**: Adopt visual styling inspired by AD Ports Group automotive marketplace.
**Rationale**:
- Professional dark navy primary color conveys trust
- Teal stock badges clearly indicate inventory availability
- Clean card shadows and refined borders improve visual hierarchy
- Consistent with established B2B automotive marketplaces
- Styling only - no functionality changes, no hardcoded features
**Consequences**:
- Added CSS variables: `--primary` (navy), `--stock` (teal), `--success` (green)
- Added badge variants: `stock` and `success` in badge.tsx
- Existing dynamic functionality (unit counts, grouping) preserved exactly
- Features not in our data model (seller ratings, verified badges) NOT added

---

### [DECISION-019] Inspection Report Scraping with Puppeteer + OpenAI
**Date**: 2024-12-22 (Updated)
**Status**: Accepted
**Context**: Vehicles from China often have inspection reports from services like Chaboshi (查博士) that are in Chinese. The pages are JavaScript-rendered (Vue.js) and simple HTTP fetch doesn't work.
**Decision**: Use Puppeteer-core to render the page in headless Chrome, then use OpenAI GPT-4o-mini to parse and extract structured data (grade, scores, conclusions).
**Rationale**:
- Chaboshi pages are Vue.js rendered - data is loaded via XHR after page load
- Puppeteer-core (no bundled Chromium) uses system Chrome installation
- Waits for `networkidle2` to ensure all XHR requests complete
- OpenAI parses the fully-rendered HTML content
- Results are cached in InspectionReport table to avoid repeated API calls
- Provides a consistent English UI for UAE buyers
**Consequences**:
- Requires Chrome/Chromium installed on server (`apt install chromium-browser`)
- Requires OPENAI_API_KEY environment variable
- ~$0.001-0.01 per scrape (one-time cost per vehicle, cached)
- Slightly slower scraping (~15-20s) but reliable for JS-heavy pages
- Validation prevents saving if OpenAI fails to extract required data

---

### [DECISION-020] Cart Duplicate Handling via Visual Feedback
**Date**: 2024-12-22
**Status**: Accepted
**Context**: When users change grouping parameters and add vehicles to cart, some vehicles may already exist in the cart from previous additions. Should we reset the cart when grouping changes, show a confirmation modal, or use a different approach?
**Decision**: Use visual feedback only - show which vehicles are already in cart, with no cart reset.
**Rationale**:
- Cart uses vehicle IDs, not grouped "buckets", so there's no data corruption
- Duplicates are already silently skipped by the cart store
- Visual indicators prevent user confusion:
  - "X in cart" badge on grouped listing cards
  - "In Cart" badge on individual vehicle rows
  - "Select All (X already in cart)" counter
  - Enhanced feedback: "Added X (Y already in cart)" message
- Resetting cart would lose user's previous work and be frustrating
- Preserves cart state across grouping changes (expected behavior)
**Consequences**:
- Users always know cart state regardless of current grouping view
- No confirmation modals or disruptive UX interruptions
- Cart store logic unchanged (addItems already filters duplicates)

---

### [DECISION-021] Grouped/Flat View Toggle
**Date**: 2024-12-22
**Status**: Accepted
**Context**: The browse page always required at least one grouping parameter. Some buyers prefer to see individual vehicles without any aggregation.
**Decision**: Add a toggle to switch between "Grouped" and "Flat" view modes on the browse page.
**Rationale**:
- Grouped view is ideal for bulk purchasing (see aggregated units by make/model/year)
- Flat view is better for browsing individual vehicles when not buying in bulk
- Same filters work in both modes for consistency
- Table view in flat mode allows sortable columns (price, year, mileage)
- Both individual and bulk add-to-cart supported in flat mode
**Consequences**:
- New API endpoint (`POST /api/vehicles/flat`) for flat listings
- View mode persisted in URL (`?view=grouped|flat`) and localStorage
- Sort params (`sortBy`, `sortOrder`) only apply in flat mode
- Grouping selector hidden in flat mode (not relevant)

---

### [DECISION-022] Vercel Deployment with Serverless Chromium
**Date**: 2024-12-22
**Status**: Accepted
**Context**: The inspection report scraper uses Puppeteer to render JavaScript-heavy Chinese inspection report pages. Vercel serverless functions don't have Chrome installed by default.
**Decision**: Use `@sparticuz/chromium` package for Vercel/Lambda environments, with fallback to local Chrome for development.
**Rationale**:
- `@sparticuz/chromium` is specifically designed for AWS Lambda/Vercel serverless
- ~50MB compressed, fits within Vercel's 250MB function limit
- Automatic detection: checks `process.env.VERCEL` to switch between serverless and local Chrome
- Local development continues to work with system-installed Chrome
**Consequences**:
- Inspection API configured with 1024MB memory, 60s timeout in `vercel.json`
- `serverExternalPackages: ['@sparticuz/chromium']` in `next.config.ts`
- Slightly slower cold starts for inspection API (~2-3s)
- Works seamlessly across local dev and production

---

### [DECISION-023] Prisma Client in Production Dependencies
**Date**: 2024-12-22
**Status**: Accepted
**Context**: Vercel builds with `npm install --production` which skips devDependencies. `@prisma/client` was incorrectly placed in devDependencies.
**Decision**: Move `@prisma/client` to dependencies, add `postinstall` script for `prisma generate`.
**Rationale**:
- Production builds need the Prisma client at runtime
- `postinstall` ensures client is generated after `npm install` on Vercel
- Build script also includes `prisma generate` as backup
**Consequences**:
- Proper Prisma client generation on Vercel
- Slightly larger production bundle (expected)

---

### [DECISION-024] Fuzzy Matching for Make/Model/Variant Validation
**Date**: 2026-01-07
**Status**: Accepted
**Context**: Sellers uploading vehicle data via Excel often have typos or variations in Make/Model/Variant fields (e.g., "Honds" instead of "Honda", "CRV" instead of "CR-V"). Client requested auto-identification and correction of such errors.
**Decision**: Implement fuzzy matching validation against a master vehicle database as a new step in the upload flow.
**Rationale**:
- Industry standard practice in automotive marketplaces (Cars.com, AutoTrader, CarDekho all use this)
- Significantly improves data quality and consistency
- Reduces upload failures due to minor typos
- Chinese sellers may have romanization variations that need normalization
- Levenshtein distance algorithm provides reliable string similarity matching
- Cascading validation (Make → Model → Variant) ensures logical consistency
**Implementation**:
- New `MasterVehicleData` Prisma model stores valid Make/Model/Variant combinations
- Pure TypeScript fuzzy matcher (no external dependencies) using Levenshtein distance
- 4-step upload wizard: Upload → Map Columns → **Review Matches** → Import
- Confidence thresholds:
  - ≥90%: Auto-correct silently
  - 70-89%: Flag for user review with suggestions
  - <70%: No match, cannot import
- Master data cached in memory (1 hour TTL) for performance
**Consequences**:
- Additional step in upload flow (but improves data quality)
- Requires maintaining master vehicle data (can be seeded from Excel)
- ~3-5 days implementation effort
- New files: `fuzzy-matcher.ts`, `fuzzy-match-review.tsx`, `validate-fuzzy/route.ts`
- Database migration needed for `MasterVehicleData` model

---

### [DECISION-025] Temporarily Disable Grouped View
**Date**: 2026-01-11
**Status**: Accepted
**Context**: The grouped view feature is complete but the user wants to focus on other features first (flat view for now) and return to grouping later.
**Decision**: Disable the "Grouped" tab in the view mode toggle without removing the code.
**Rationale**:
- User wants to prioritize other features before polishing grouped view
- All grouped view code remains intact for future use
- Easy to re-enable: just modify `DISABLED_VIEW_MODES` array in `buyer-browse-client.tsx`
- Clear UX indicator "(Soon)" shows users the feature is coming
**Consequences**:
- Browse page defaults to flat view only
- Grouped tab shows as disabled with "(Soon)" text
- URL/localStorage with `view=grouped` is ignored, defaults to flat
- To re-enable: change `const DISABLED_VIEW_MODES: ViewMode[] = ['grouped'];` to `[]`

---

### [DECISION-026] Approved Negotiations as Completed Deals
**Date**: 2026-01-11
**Status**: Accepted
**Context**: When a seller approves a negotiation (SELLER_APPROVED status), what should happen when the buyer clicks "Negotiate" again for the same seller with new cart items?
**Decision**: SELLER_APPROVED negotiations are treated as completed deals, not active negotiations. Buyers can start new negotiations with the same seller.
**Rationale**:
- A completed deal is done - payment/checkout is the next step
- Buyers should be able to add new vehicles and negotiate separately
- Prevents confusion between old approved deals and new negotiations
- Approved deals are shown in a separate `/buyer/deals` page
**Consequences**:
- Active negotiation lookup only includes DRAFT and BUYER_FINALIZED statuses
- Approved deals banner shown on negotiate page if any exist
- New `/buyer/deals` page for viewing/proceeding with approved deals
- Clear separation between negotiation (in-progress) and deals (ready for checkout)

---

### [DECISION-027] Auto-Clear Cart on Deal Approval
**Date**: 2026-01-11
**Status**: Accepted
**Context**: When a negotiation is approved by the seller, what should happen to those items in the buyer's cart?
**Decision**: Automatically remove the negotiation's vehicle IDs from the cart and redirect to the deals page.
**Rationale**:
- Prevents duplicate items (cart vs approved deal)
- Clear user flow: approved items move to "Deals" for checkout
- Reduces confusion about what's in cart vs what's ready to purchase
- Automatic cleanup is better UX than manual removal
**Consequences**:
- useEffect watches negotiation status, triggers on SELLER_APPROVED
- removeItems called with vehicle IDs from negotiation
- Automatic redirect to `/buyer/deals/[id]`
- Cart stays lean with only items still being negotiated or pending

---

## Proposed Decisions

(Add decisions under discussion here)

*None pending*

---

## Deprecated Decisions

(Move old decisions here if we change approach)

*None yet*
