# Agent Instructions & Project Guidelines (AGENTS.md)

This file contains strict guidelines, coding conventions, architectural boundaries, and operational procedures for AI assistants and autonomous agents working within the **Aathithiya School ERP** repository.

> **Required Reading:**
> - [**`constant.md`**](./constant.md): The Memory Anchor — Immutable domain logic, fixed targets, roles, and ADRs.
> - [**`standard.md`**](./standard.md): The Enforcement Layer — Strict syntax standards, error handling, and self-review checklists.

---

## 1. Monorepo Structure & Package Overview

This project is a multi-project repository consisting of three primary packages:

1. **`backend/`**: Node.js REST API and WebSocket real-time server.
   - **Stack:** Express 5.2.1, TypeScript 7, Mongoose 9, Socket.io 4.8, tsx.
   - **Database:** MongoDB (via Mongoose ODM).
2. **`frontend/`**: Web application serving 4 distinct portals (Admin, Teacher, Student, Parent).
   - **Stack:** Next.js 16.3.3 (App Router), React 19.2.8, Tailwind CSS v4, Zustand 5, TanStack React Query 5, Lucide React, Sonner.
3. **`parent-app/`**: Cross-platform mobile application for Parents.
   - **Stack:** React Native 0.72.6, React 18.2, TypeScript 4.8, React Navigation 6, Axios, AsyncStorage, Socket.io-client.

---

## 2. Essential Commands

### Backend (`backend/`)
- Install packages: `npm install`
- Dev server (live reload): `npm run dev` (`tsx watch server.ts`)
- Seed database: `npm run seed` (`tsx src/seedSampleData.ts`)
- Build TypeScript: `npm run build` (`tsc`)
- Production run: `npm start` (`node dist/server.js`)

### Frontend (`frontend/`)
- Install packages: `npm install`
- Dev server: `npm run dev` (Runs on `http://localhost:3000`)
- Build: `npm run build`
- Start built app: `npm run start`
- Lint: `npm run lint`
- E2E Tests: `npx playwright test`

### Parent App (`parent-app/`)
- Install packages: `npm install`
- Start Metro bundler: `npm start`
- Run Android: `npm run android`
- Run iOS: `npm run ios`
- Test: `npm test`
- Lint: `npm run lint`

---

## 3. Strict Coding Conventions & Guardrails

### 3.1 General TypeScript Rules
- **No `any`**: Strictly define interfaces and types. If dynamic, use `unknown` with type guards.
- **Strict Null Checks**: Always handle `null` and `undefined` safely; do not use non-null assertions (`!`) unless validated immediately above.
- **File Naming**:
  - Components: `PascalCase.tsx`
  - Hooks: `useCamelCase.ts`
  - Routes, controllers, utilities: `camelCase.ts`
  - Models: `PascalCase.ts`

### 3.2 Backend Guidelines (`backend/`)
- **Controller Pattern**: Wrap every route controller with `asyncHandler` to ensure uncaught rejections propagate to `errorHandler`.
- **Mongoose Schemas**:
  - Always export both the Mongoose Model and the TypeScript interface (e.g., `export interface IUser extends Document`, `export default mongoose.model<IUser>('User', UserSchema)`).
  - Use timestamps: `{ timestamps: true }`.
  - For soft deletes, support `isDeleted: { type: Boolean, default: false }` and `deletedAt`.
- **Authentication & RBAC**:
  - Roles are defined in `backend/src/models/User.ts`: `SUPER_ADMIN`, `SUB_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`.
  - Authenticated user payload is attached to `req.user`.
  - Use `authenticateToken` middleware on private routes and `requireRole(...)` for role-restricted routes.
- **Passwords**: Never store or return raw passwords. Passwords must be hashed with `bcryptjs` in a Mongoose pre-save hook.
- **WebSocket (Socket.io)**: Access the IO instance via `req.app.get('io')` in controllers to broadcast events to specific rooms or clients.

### 3.3 Frontend Guidelines (`frontend/`)
- **Next.js App Router**:
  - Server components are the default. Add `'use client';` only when utilizing React hooks (`useState`, `useEffect`, etc.), browser events, or client-side libraries.
  - Role portal routes are organized under `src/app/admin/*`, `src/app/teacher/*`, `src/app/student/*`, and `src/app/parent/*`.
- **Styling**:
  - Use Tailwind CSS utility classes. Avoid inline style objects unless calculating dynamic pixel offsets.
  - Use `lucide-react` for UI icons.
- **State & Data Fetching**:
  - Use **Zustand** (`src/store/authStore.ts`) for client auth state, user profile, and session persistence.
  - Use **TanStack React Query** for server-state caching, mutations, and optimistic updates.
  - Use **Sonner** (`toast.success()`, `toast.error()`) for user notifications.
- **API Requests**:
  - Always import the configured Axios instance from `@/lib/axios`. It handles cookies, base URLs, and token injection.

### 3.4 Parent Mobile App Guidelines (`parent-app/`)
- **React Native Components**:
  - Use `StyleSheet.create` for styling.
  - Support both iOS and Android safe areas via `react-native-safe-area-context`.
- **Network Requests**:
  - Use the pre-configured Axios instance from `src/config/api.ts`.
  - Store tokens using `@react-native-async-storage/async-storage` with the key `'parent_token'`.

---

## 4. Environment Variables Checklist

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/school-erp
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
BREVO_API_KEY=optional_email_service_key
BREVO_SENDER_EMAIL=optional_sender_email
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 5. Do's and Don'ts for AI Agents

- ❌ **DO NOT** modify or break existing backend API endpoint signatures without updating both the frontend services and the mobile app client.
- ❌ **DO NOT** hardcode database credentials, secret keys, or URLs inside source files.
- ❌ **DO NOT** delete or overwrite existing comments, documentation, or test specs.
- ✅ **DO** run typechecks and tests (`npm run build` or `npx tsc --noEmit`) before completing any task.
- ✅ **DO** keep components modular, breaking complex UI into atoms/molecules/organisms as structured in `frontend/src/components/`.
