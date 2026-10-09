# Tax-Refund-Frontend AI Rules

This document defines mandatory frontend development rules
for AI assistants working in performance-view-frontend.

All generated code MUST follow these rules.

---

## 1. Tech Stack

Framework:
- Next.js (App Router)
- TypeScript (strict mode)

UI:
- Tailwind CSS
- shadcn/ui

Data Fetching:
- TanStack Query

HTTP Client:
- axios (centralized instance)

Architecture:
- Feature-based folder structure

---

## 2. Core Principles

AI must:

- Prefer Server Components by default
- Use Client Components ONLY when required
- Create reusable components
- Avoid duplicated logic
- Follow existing project patterns
- Make minimal file modifications
- Keep components clean and maintainable

DO NOT introduce new architectural patterns.

---

## 3. Folder Structure (MANDATORY)

src/

features/
 ├── brand/
 │    ├── api/
 │    ├── components/
 │    ├── hooks/
 │    ├── types/
 │    └── pages/

shared/
 ├── components/
 ├── ui/
 ├── lib/
 ├── hooks/
 └── types/

---

## 4. Component Rules

### Server Component (Default)

Use Server Component unless:

- using state
- browser API
- event handler
- TanStack Query hook

DO NOT add:

"use client"

unless strictly necessary.

---

### Client Component Rules

If client component required:

- keep logic minimal
- move business logic to hooks
- avoid large components

---

## 5. API Layer Rules

All API calls MUST go through:


Rules:

- NEVER call fetch directly
- NEVER create axios instance per feature
- reuse centralized axios client

Example:

```ts
api.get("/brand")

## 6. TanStack Query Rules

Rules:

- Queries inside feature hook
- No query inside UI component
- Separate query & mutation hooks

Correct : 
features/brand/hooks/useBrands.ts

Example : 
export const useBrands = () =>
  useQuery({
    queryKey: ["brands"],
    queryFn: getBrands
  });

## 7. Styling Rules

Use:

- Tailwind utility classes
- shadcn/ui components

DO NOT:
write custom CSS files
inline styles
duplicate UI components
Extend existing shared components instead.

## 8. State Management

Allowed:

TanStack Query
React local state

Avoid:
global state unless necessary
unnecessary context providers
Server state MUST use TanStack Query.

## 9. TypeScript Rules

STRICT MODE REQUIRED.

AI must:

never use any
define response types
reuse shared types
create DTO types per feature

Example:
features/brand/types/brand.type.ts

## 10. Form Rules

Forms must use:

react-hook-form
zod validation
Validation schema separated from component.

## 11. Naming Convention

Components:
BrandTable.tsx
BrandForm.tsx

Hooks:
useBrands.ts
useCreateBrand.ts

API :
brand.api.ts

Types :
brand.type.ts

## 12. Performance Rules

AI must:

avoid unnecessary re-render
memoize heavy components
split large components
lazy load when possible

## 13. Modification Rules

Before writing code:

Analyze existing feature
Reuse patterns
Modify minimal files
Keep consistency
Never rewrite unrelated modules.

## 14. Forbidden Actions

AI MUST NOT:

introduce Redux/Zustand
bypass API layer
duplicate components
change folder structure
add client component unnecessarily

## 15. AI Execution Rule

Before implementation:
understand feature structure
follow repository architecture
reuse shared modules
After implementation:
ensure TypeScript passes
ensure build success