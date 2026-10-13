# Development Standards & Enforcement Layer (standard.md)

> **Role: The Enforcement Layer (The "How To")**  
> This file defines the strict code quality, syntax paradigms, error-handling protocols, testing benchmarks, and review checklists for **Aathithiya School ERP**.  
> **Rule for AI Agents:** This document is an active compliance checklist. You must apply these standards to every file created or modified and run the pre-completion verification before finishing any task.

---

## 1. Syntax, Formatting & Coding Standards

### 1.1 General TypeScript Rules
- **Zero `any` Policy:** Strictly prohibit `any`. Use strongly typed interfaces, generic types, or `unknown` accompanied by type narrowing/guards.
- **Strict Null Safety:** Avoid non-null assertion operators (`!`) unless the value was validated immediately preceding the usage. Handle `null` and `undefined` with optional chaining (`?.`) and nullish coalescing (`??`).
- **Naming Conventions:**
  - Components & Models: `PascalCase` (e.g., `FeeRecord.ts`, `StudentCard.tsx`)
  - Controllers, Routes, Hooks, Utilities: `camelCase` (e.g., `attendanceController.ts`, `useAuth.ts`)
  - Constants & Enums: `UPPER_SNAKE_CASE` (e.g., `UserRole.SUPER_ADMIN`)
  - Interfaces: `I` prefix for Mongoose documents (e.g., `IUser`, `IFeeRecord`), plain PascalCase for frontend DTOs (e.g., `UserProfile`).

### 1.2 Backend Standards (`backend/`)
- **Controller Wrapping:** **Every** controller method must be wrapped with `asyncHandler`:
  ```typescript
  export const getStudents = asyncHandler(async (req: Request, res: Response) => {
    const students = await StudentProfile.find({ isDeleted: { $ne: true } });
    res.status(200).json({ success: true, data: students });
  });
  ```
- **Mongoose Schema Pattern:**
  - Always export both the TypeScript interface and the compiled Mongoose model:
    ```typescript
    export interface IStudent extends Document { ... }
    export default mongoose.model<IStudent>('StudentProfile', StudentSchema);
    ```
  - Always activate timestamps: `{ timestamps: true }`.
  - Always index frequently queried foreign keys (`student`, `class`, `batch`, `role`).
- **Standardized Response Envelope:**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully",
    "data": {}
  }
  ```

### 1.3 Frontend Standards (`frontend/`)
- **Server Components by Default:** Next.js App Router components must remain React Server Components (RSC) unless interactivity is required.
- **Client Components Rule:** Add `'use client';` at the top of the file **only** when using:
  - React hooks (`useState`, `useEffect`, `useCallback`, etc.)
  - Browser-only APIs (`window`, `localStorage`, `document`)
  - Interactive event listeners (`onClick`, `onChange`, `onSubmit`)
- **Styling Discipline:**
  - Exclusively use Tailwind CSS utility classes.
  - **No inline styles** (`style={{ ... }}`), except for purely dynamic pixel calculations (e.g., dynamic progress bar width or custom canvas coordinates).
- **Icons & Visuals:** Exclusively use `lucide-react` for icons. Keep icon sizes consistent (`className="w-4 h-4"` or `className="w-5 h-5"`).
- **Notifications:** Use `sonner` toasts exclusively (`toast.success('...')`, `toast.error('...')`). Avoid browser `alert()`.
- **API Fetching:** Always import the configured Axios instance from `@/lib/axios`. Never instantiate raw `fetch()` or a new `axios.create()` in components.

### 1.4 Parent Mobile App Standards (`parent-app/`)
- **Styling Pattern:** Use `StyleSheet.create({ ... })` at the bottom of the screen file. Do not use inline style objects inside JSX.
- **Safe Area Insets:** All top-level screens must use safe area padding from `react-native-safe-area-context`.
- **API Client:** Use the pre-configured Axios instance from `src/config/api.ts`.

---

## 2. Error-Handling & Logging Protocols

- **No Silent Error Swallowing:** Never use empty `catch {}` blocks. If an error is caught, log it with context or forward it to the error handler.
- **Centralized Error Propagation:** Backend controllers must throw or pass errors to `next(err)`. The global `errorHandler` middleware in `src/middlewares/error.middleware.ts` handles formatting and status mapping.
- **HTTP Status Code Mapping:**
  - `200 OK`: Successful retrieval / update
  - `201 Created`: Successful resource creation
  - `400 Bad Request`: Validation failure or missing required fields
  - `401 Unauthorized`: Missing or invalid authentication token
  - `403 Forbidden`: Authenticated user lacks sufficient permissions
  - `404 Not Found`: Requested resource does not exist or has been soft-deleted
  - `500 Internal Server Error`: Unhandled server/database exception

---

## 3. Dependency & Security Guidelines

- **Package Addition Restrictions:** Do not install third-party packages for simple tasks that can be accomplished with standard TypeScript, built-in Node modules, or existing libraries in the repo.
- **Zero Secrets in Code:** Never commit database credentials, API keys, JWT secrets, or production URLs in source code. Always reference `process.env`.
- **Injection & Sanitization:** Validate all query parameters and request bodies before executing database operations.

---

## 4. AI Pre-Completion Verification Checklist

Before reporting a task as complete, every AI assistant must execute this self-review:

- [ ] **Typecheck Passed:** Run `npm run build` or `npx tsc --noEmit` in the modified package (`backend/`, `frontend/`, or `parent-app/`) with zero errors.
- [ ] **No `any` Added:** Verify no `any` types were introduced in new or updated files.
- [ ] **No Breaking API Signatures:** Verify that existing backend endpoints, routes, and response bodies remain compatible with both frontend and parent mobile clients.
- [ ] **Controller Safety:** Verify that every new Express controller is wrapped with `asyncHandler`.
- [ ] **Component Rules:** Verify that new Next.js components use `'use client'` only where necessary and use Tailwind CSS utility classes.
- [ ] **Constants Compliance:** Verify changes against [`constant.md`](./constant.md) to ensure no domain constants, soft-delete invariants, or role enums were violated.
