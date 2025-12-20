# AI Session Prompts

> Copy-paste these prompts to start AI coding sessions. Customize as needed.

---

## Session Starter Prompt

Use this at the START of every coding session:

```
I'm building a B2B auto marketplace MVP. Please read these context files to understand the current state:

1. Read .ai/CONTEXT.md for project overview and current state
2. Read .ai/TASK_QUEUE.md for what to work on
3. Read .ai/DECISIONS.md for architectural decisions

Today I want to work on: [DESCRIBE TASK]

The relevant spec file is: specs/features/[FEATURE].md

Please confirm you understand the context before we start coding.
```

---

## Feature Implementation Prompt

```
I need to implement [FEATURE NAME].

Spec file: specs/features/[filename].md

Current context:
- We're using Next.js 14 App Router with TypeScript
- Database: Supabase/PostgreSQL with Prisma ORM
- UI: Tailwind CSS + Shadcn/UI components
- State: Zustand for client state

Please:
1. Read the spec file first
2. List out the files you'll create/modify
3. Implement step by step
4. Use existing patterns from the codebase

Start by showing me the file list, then we'll implement each.
```

---

## Bug Fix Prompt

```
There's a bug in [COMPONENT/FEATURE]:

**Expected behavior**: [what should happen]
**Actual behavior**: [what's happening]
**Steps to reproduce**: [how to trigger it]

Relevant files:
- [file1.tsx]
- [file2.ts]

Please analyze and fix.
```

---

## Code Review Prompt

```
Please review this code for:
1. TypeScript best practices
2. React/Next.js patterns
3. Security issues
4. Performance concerns
5. Accessibility

[PASTE CODE]
```

---

## End of Session Prompt

Use this at the END of every session:

```
We're ending this session. Please help me update the context files:

1. What changes were made to .ai/CONTEXT.md?
   - Update "Current State" section
   - List files modified
   - Note any new issues

2. What changes to .ai/TASK_QUEUE.md?
   - Which tasks were completed?
   - Any new tasks discovered?

3. Any new decisions for .ai/DECISIONS.md?

Please provide the updated content for each file.
```

---

## Specific Feature Prompts

### Excel Upload + Column Mapping

```
I need to build the Excel upload with column mapping feature.

Spec: specs/features/seller-upload.md

The flow is:
1. Seller drops an Excel/CSV file
2. We parse and show first 5 rows as preview
3. We show detected column headers
4. Seller maps each column to our database fields
5. Seller can save mapping for reuse
6. We validate and import the data

Libraries available:
- xlsx (for parsing Excel)
- Shadcn/UI components for the UI

Let's build this step by step. Start with the file upload component.
```

### Dynamic Grouping

```
I need to build the dynamic vehicle grouping feature - this is the core of our MVP.

Spec: specs/features/buyer-grouping.md

The concept:
1. Buyer selects which parameters to group by (checkboxes: make, model, year, etc.)
2. We query the database with a dynamic GROUP BY clause
3. Results show grouped listings with unit count and price range
4. Buyer can expand a group to see individual vehicles

Key challenge: The GROUP BY query is built dynamically based on user's selection.

Let's start with:
1. The grouping parameter selector component
2. The API endpoint that builds the dynamic query
3. The grouped listings display

Start with step 1.
```

### Cart Implementation

```
I need to build the cart functionality.

Spec: specs/features/buyer-cart.md

Requirements:
1. Cart stored in Zustand + localStorage
2. Can add single vehicles or bulk (multiple from a group)
3. Cart groups items by seller
4. Shows price subtotals per seller and total
5. Can remove items

Start by creating the Zustand store, then the UI components.
```

---

## Database Query Help

```
I need help with a Prisma/PostgreSQL query.

Goal: [describe what you want to query]

Current schema: (see prisma/schema.prisma)

Please provide the Prisma query and explain it.
```

---

## Component Creation

```
I need a new React component.

Name: [ComponentName]
Location: src/components/[folder]/

Props:
- [prop1]: [type] - [description]
- [prop2]: [type] - [description]

Behavior:
- [describe what it does]
- [interactions]
- [states]

Use Tailwind + Shadcn patterns. Make it accessible.
```

---

## API Endpoint Creation

```
I need a new API endpoint.

Route: /api/[path]
Method: [GET/POST/PUT/DELETE]

Input: [describe request body/params]
Output: [describe response]

Business logic:
- [step 1]
- [step 2]

Use Prisma for database operations. Include error handling.
```

