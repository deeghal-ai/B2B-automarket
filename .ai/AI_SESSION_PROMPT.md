# AI Session Starter Prompt

Copy and paste EVERYTHING below the line when starting a new AI coding session.

---

## REQUIRED: Read This First

You are helping me build a B2B auto marketplace MVP. This project uses **spec-driven development** - we have detailed specifications and context files that you MUST read before writing any code.

### Step 1: Read These Files (IN ORDER)

1. **`.ai/CONTEXT.md`** - Current project state, what's built, what's working, technical patterns
2. **`.ai/TASK_QUEUE.md`** - Prioritized tasks, what to work on next
3. **`.ai/DECISIONS.md`** - Architecture decisions and WHY we made them

### Step 2: Read the Relevant Spec

Before implementing any feature, read its specification:
- `specs/features/seller-upload.md` - Excel upload with column mapping
- `specs/features/seller-inventory.md` - Inventory management
- `specs/features/buyer-grouping.md` - Dynamic vehicle grouping (CORE FEATURE)
- `specs/features/buyer-detail.md` - Vehicle detail page
- `specs/features/buyer-cart.md` - Shopping cart
- `specs/ARCHITECTURE.md` - System overview
- `specs/DATA_MODEL.md` - Database schema

### Step 3: Confirm Understanding

After reading, tell me:
1. What is the current state of the project?
2. What are the P0 (highest priority) tasks?
3. What patterns should you follow?

---

## Working Rules

### Code Style
- TypeScript strict mode - NO `any` types
- Use existing patterns from CONTEXT.md
- Server Components by default, 'use client' only when needed
- All DB queries through Prisma (not raw Supabase)
- Keep components small and focused

### Before Writing Code
1. State which files you'll create/modify
2. Explain your approach briefly
3. Reference the spec you're following

### After Each Task
1. Summarize what was built
2. Note any issues or TODOs
3. Update in .ai/ files

---

## End of Session Protocol

At the END of our session, update:

1. **`.ai/CONTEXT.md`**:
   - Update "Last Updated" date
   - Update "Last Session Focus"
   - Check off completed items in "What's Been Built"
   - Add any new files to "Key Files Modified Recently"
   - Document any new "Known Issues"

2. **`.ai/TASK_QUEUE.md`**:
   - Check off completed tasks
   - Add any new tasks discovered
   - Update "Session History" table

3. **`.ai/DECISIONS.md`**:
   - Add any new architecture decisions made

Update content for each file.

---

## Today's Session

**What I want to work on today:** "in browse page , the grouped view is disabled, just activate it again keeping all else same"

**Relevant spec file:**

Please start by reading the files mentioned above and confirming your understanding.
