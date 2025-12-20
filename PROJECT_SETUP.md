# B2B Auto Marketplace - Project Setup Guide

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free at supabase.com)
- A code editor (VS Code recommended)

### Step 1: Create Your Project Folder

```bash
mkdir b2b-auto-marketplace
cd b2b-auto-marketplace
```

### Step 2: Copy All Files from This Package

Copy the entire contents of this folder into your project directory. Your structure should look like:

```
b2b-auto-marketplace/
├── .ai/                      # AI Context Files (THE KEY TO SPEC-DRIVEN DEV)
│   ├── CONTEXT.md            # Current state - UPDATE AFTER EVERY SESSION
│   ├── DECISIONS.md          # Architecture decisions log
│   ├── TASK_QUEUE.md         # What to build next
│   └── PROMPTS.md            # Reusable prompts for AI sessions
├── specs/                    # Feature Specifications
│   ├── ARCHITECTURE.md       # System overview
│   ├── DATA_MODEL.md         # Database schema
│   ├── features/
│   │   ├── seller-upload.md
│   │   ├── seller-inventory.md
│   │   ├── buyer-grouping.md
│   │   ├── buyer-detail.md
│   │   └── buyer-cart.md
│   └── api/
│       └── endpoints.md
├── prisma/
│   └── schema.prisma         # Database schema
├── src/                      # Application code (created during setup)
└── package.json
```

### Step 3: Initialize the Next.js Project

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

When prompted:
- Would you like to use TypeScript? → **Yes**
- Would you like to use ESLint? → **Yes**  
- Would you like to use Tailwind CSS? → **Yes**
- Would you like to use `src/` directory? → **Yes**
- Would you like to use App Router? → **Yes**
- Would you like to customize the default import alias? → **No**

### Step 4: Install Dependencies

```bash
npm install @prisma/client @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install xlsx zustand @tanstack/react-query
npm install -D prisma
```

### Step 5: Install Shadcn/UI

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Then install core components:
```bash
npx shadcn@latest add button card input label select checkbox table dialog sheet tabs badge
```

### Step 6: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Settings → API
3. Create a `.env.local` file:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-database-url  # From Settings → Database → Connection string (URI)
```

### Step 7: Initialize Prisma

```bash
npx prisma init
```

Then replace `prisma/schema.prisma` with the one from this package.

### Step 8: Push Schema to Database

```bash
npx prisma db push
npx prisma generate
```

### Step 9: Verify Setup

```bash
npm run dev
```

Visit http://localhost:3000 - you should see the Next.js starter page.

---

## How to Use This With AI Coding Assistants

### Before Each Session

1. Open `.ai/CONTEXT.md` and read the current state
2. Check `.ai/TASK_QUEUE.md` for what to work on next
3. Start your AI session with the prompt from `.ai/PROMPTS.md`

### During Each Session

1. Reference the relevant spec file in `specs/features/`
2. Build incrementally - one feature at a time
3. Test as you go

### After Each Session

**CRITICAL: Update these files before ending your session:**

1. `.ai/CONTEXT.md` - Update "Current State" section
2. `.ai/TASK_QUEUE.md` - Check off completed tasks, add new ones
3. `.ai/DECISIONS.md` - Log any architectural decisions made

This creates continuity between AI sessions!

---

## Development Order (Follow This Sequence)

### Phase 1: Foundation
- [ ] Database schema + Prisma setup
- [ ] Supabase auth (email/password)
- [ ] Basic layout (header, sidebar shells)
- [ ] Seller registration flow

### Phase 2: Seller Features  
- [ ] Excel upload with column mapping
- [ ] Inventory list view
- [ ] Edit vehicle form
- [ ] Publish/Draft toggle
- [ ] Image upload

### Phase 3: Buyer Core (Your MVP Differentiator)
- [ ] Dynamic grouping parameter selector
- [ ] Grouped listings view
- [ ] Expand group to see units
- [ ] Vehicle detail page

### Phase 4: Cart & Checkout
- [ ] Add to cart (bulk + single)
- [ ] Cart page with multi-seller support
- [ ] Basic checkout/inquiry flow

---

## Folder Reference

After setup, your `src/` folder should be organized as:

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── seller/
│   │   ├── layout.tsx          # Seller dashboard layout
│   │   ├── page.tsx            # Seller dashboard home
│   │   ├── upload/page.tsx     # Excel upload + mapping
│   │   └── inventory/page.tsx  # Manage vehicles
│   ├── buyer/
│   │   ├── layout.tsx          # Buyer layout
│   │   ├── page.tsx            # Browse with grouping
│   │   ├── vehicle/[id]/page.tsx
│   │   └── cart/page.tsx
│   └── api/
│       ├── vehicles/
│       ├── upload/
│       └── cart/
├── components/
│   ├── ui/                     # Shadcn components
│   ├── seller/
│   ├── buyer/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── prisma.ts
│   └── utils.ts
├── hooks/
├── stores/                     # Zustand stores
│   └── cart-store.ts
└── types/
    └── index.ts
```

