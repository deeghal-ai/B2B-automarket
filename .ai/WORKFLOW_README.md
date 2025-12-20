# Spec-Driven Development Workflow

This document explains how to work with AI assistants (Cursor, Claude, etc.) on this project using spec-driven development.

## Quick Start

### 1. Setup Cursor (One Time)

Copy `.cursorrules` to your project root:
```bash
cp .cursorrules ~/b2b-auto-marketplace/
```

This gives Cursor a system prompt with all project context.

### 2. Setup AI Context Folder (One Time)

Copy the `.ai/` folder to your project:
```bash
cp -r .ai ~/b2b-auto-marketplace/
```

### 3. Starting Any AI Session

Copy the contents of `AI_SESSION_PROMPT.md` and paste it at the start of your chat/conversation. Fill in what you want to work on.

### 4. Ending Any AI Session

Ask the AI to help update the `.ai/` files with what was accomplished.

---

## The Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     START NEW SESSION                           │
├─────────────────────────────────────────────────────────────────┤
│  1. Paste Session Starter Prompt                                │
│  2. AI reads .ai/CONTEXT.md, .ai/TASK_QUEUE.md                 │
│  3. AI confirms understanding                                   │
│  4. Tell AI what you want to build                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DURING SESSION                             │
├─────────────────────────────────────────────────────────────────┤
│  1. AI reads relevant spec from specs/features/                 │
│  2. AI lists files to create/modify                            │
│  3. AI implements following patterns                           │
│  4. You review and test                                        │
│  5. Iterate as needed                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      END SESSION                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Paste Session End Prompt                                    │
│  2. AI provides updates for .ai/ files                         │
│  3. You copy updates to the files                              │
│  4. Next session starts with full context                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Reference

### `.ai/` Folder (Update Every Session)

| File | Purpose | When to Update |
|------|---------|----------------|
| `CONTEXT.md` | Current project state | Every session end |
| `TASK_QUEUE.md` | Tasks and priorities | Every session end |
| `DECISIONS.md` | Architecture decisions | When making decisions |
| `PROMPTS.md` | Reusable prompts | As needed |

### `specs/` Folder (Reference Only)

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | System design overview |
| `DATA_MODEL.md` | Database schema |
| `features/seller-upload.md` | Excel upload spec |
| `features/seller-inventory.md` | Inventory management spec |
| `features/buyer-grouping.md` | Dynamic grouping spec |
| `features/buyer-detail.md` | Vehicle detail spec |
| `features/buyer-cart.md` | Cart spec |

### `.cursorrules` (Cursor System Prompt)

Automatically loaded by Cursor. Contains:
- Project overview
- Tech stack
- Code patterns
- File structure
- Coding rules

---

## Example Session

### Starting

```
You are helping me build a B2B auto marketplace. This project uses spec-driven development.

BEFORE WRITING ANY CODE, you must:
1. Read `.ai/CONTEXT.md` - understand current project state
2. Read `.ai/TASK_QUEUE.md` - see priorities and completed work
3. Read the relevant spec in `specs/features/` for what we're building

After reading, confirm:
- What phase are we in?
- What are the P0 tasks?
- What patterns should you follow?

Today I want to work on: Seller Excel Upload with Column Mapping

Start by reading the files, then confirm your understanding.
```

### AI Response (Example)

```
I've read the context files. Here's my understanding:

**Current State:**
- Phase 1 (Foundation) is complete
- Auth, layouts, and basic pages are working
- We're ready for Phase 2 (Seller Upload)

**P0 Tasks:**
- Create upload page UI
- File dropzone for Excel/CSV
- Parse Excel with xlsx library
- Preview first 5 rows

**Patterns to Follow:**
- Server Components by default
- Prisma for database
- TypeScript strict (no any)
- shadcn/ui for components

I'll now read specs/features/seller-upload.md...

[Lists files to create]
```

### Ending

```
We're ending this session. Help me update the context files:

1. For `.ai/CONTEXT.md`, provide updates
2. For `.ai/TASK_QUEUE.md`, provide updates
3. For `.ai/DECISIONS.md`, add any decisions

Give me the exact text to copy-paste into each file.
```

---

## Tips for Best Results

### DO:
- ✅ Always paste the session starter prompt
- ✅ Let the AI read specs before coding
- ✅ Review code before accepting
- ✅ Update .ai/ files at end of every session
- ✅ Keep sessions focused on one feature

### DON'T:
- ❌ Skip the context reading step
- ❌ Let AI code without reading the spec
- ❌ Forget to update .ai/ files
- ❌ Try to build everything in one session
- ❌ Accept code without testing

---

## Switching Between AI Assistants

The `.ai/` files are the "shared memory" between sessions and assistants. As long as you:

1. Start each session with the starter prompt
2. End each session by updating the .ai/ files

You can seamlessly switch between:
- Cursor (with .cursorrules)
- Claude
- ChatGPT
- Any other AI assistant

The context will carry over because it's stored in files, not in any AI's memory.

---

## Troubleshooting

**AI isn't following patterns:**
→ Make sure it read CONTEXT.md first

**AI doesn't know current state:**
→ Check if .ai/ files were updated after last session

**AI making wrong architecture choices:**
→ Point it to DECISIONS.md

**AI missing feature requirements:**
→ Point it to the specific spec file

**Context files getting stale:**
→ Commit to updating them EVERY session
