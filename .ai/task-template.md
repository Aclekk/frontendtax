# Tax-Refund-Frontend - AI Task Execution Template

This document defines how AI assistants must execute
development tasks inside this repository.

AI MUST follow this workflow for EVERY task.

---

## 1. Task Understanding Phase (MANDATORY)

Before writing any code:

- Understand the requested feature
- Identify affected module
- Analyze existing implementation patterns
- Reuse existing architecture
- Avoid introducing new patterns

AI must NOT start coding immediately.

---

## 2. Scope Definition

AI must clearly determine:

- Target feature/module
- Files to modify
- Dependencies impacted
- API or UI affected

Only modify related modules.

DO NOT change unrelated files.

---

## 3. Planning Phase (REQUIRED)

AI must create an implementation plan first.

Plan must include:

1. Files to create/update
2. Data flow
3. API interaction
4. Component structure
5. Validation logic
6. Expected outcome

Wait for approval OR continue if auto-execution enabled.

---

## 4. Implementation Rules

During implementation:

- Follow `.ai/memory.md`
- Follow frontend/backend rules
- Reuse shared components/services
- Apply minimal modification principle
- Keep code production-ready

DO:

✅ small incremental changes  
✅ consistent naming  
✅ reusable logic  

DO NOT:

❌ rewrite modules  
❌ duplicate logic  
❌ introduce new architecture  

---

## 5. Frontend Specific Process

When task involves frontend:

1. Create API layer if needed
2. Create feature hook
3. Implement UI component
4. Connect TanStack Query
5. Apply shadcn/ui styling
6. Ensure TypeScript strict compliance

Server Component preferred.

---

## 6. Backend Specific Process

When task involves backend:

1. Entity / DTO validation
2. Repository update
3. Service logic
4. Controller endpoint
5. Dependency injection registration

Controller must contain NO business logic.

---

## 7. Build & Validation Phase (MANDATORY)

After implementation:

AI must:

- Run build
- Check TypeScript errors
- Fix compilation issues
- Resolve imports
- Ensure application runs

Repeat until build succeeds.

---

## 8. Error Handling Loop

If errors occur:

1. Read error message
2. Identify root cause
3. Apply minimal fix
4. Rebuild
5. Repeat automatically

Do NOT stop midway.

---

## 9. Code Quality Enforcement

Generated code must be:

- Clean
- Typed
- Modular
- Maintainable
- Production-ready

Avoid temporary or experimental solutions.

---

## 10. Completion Criteria

Task considered complete only if:

✅ Feature implemented  
✅ Build successful  
✅ No type errors  
✅ Architecture respected  
✅ Minimal changes applied  

---

## 11. AI Behavior Rules

AI must behave as:

> Senior Fullstack Engineer working inside existing enterprise codebase.

AI must prioritize:

- consistency
- maintainability
- performance
- clarity

---

## 12. Default Execution Instruction

Unless specified otherwise:

- Plan first
- Implement second
- Validate third
- Fix automatically