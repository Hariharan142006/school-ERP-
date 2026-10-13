# Aathithiya School ERP

A complete, enterprise-grade School Management & ERP ecosystem built for K-12 schools and educational institutions. This multi-application repository provides web portals for administrators, teachers, students, and parents, a dedicated React Native mobile app for parents, and a centralized Node.js/Express REST & WebSocket backend.

---

## 🏗️ Repository Architecture

The repository is structured into three main sub-projects:

```
Aathithiya_School_ERP/
├── backend/            # Express 5 + TypeScript + MongoDB + Socket.io REST API & Realtime Server
├── frontend/           # Next.js 16 (App Router) + React 19 + Tailwind CSS Web Portals
├── parent-app/         # React Native (Android / iOS) Mobile Application for Parents
├── AGENTS.md           # AI coding guidelines and architectural guardrails
├── ARCHITECTURE.md     # In-depth system design, data flow, and ER diagrams
├── PRD.md              # Product requirements, personas, and feature specifications
└── TODO.md             # Development roadmap and task completion status
```

---

## 🌟 Key Modules & Features

- **Multi-Role Web Portals**: Dedicated interfaces for `SUPER_ADMIN`, `SUB_ADMIN`, `TEACHER`, `STUDENT`, and `PARENT`.
- **Student & Staff Information System**: Complete demographic profiles, emergency contacts, documents, and historical records.
- **Academic Setup**: Classes, batches/sections, subjects, and timetables.
- **Attendance Tracking**: Real-time daily/subject-wise attendance with instant alerts.
- **Fee Management & Finance**: Fee head configuration, multi-mode collections (Cash, UPI, Card, Net Banking), partial payments, receipts, and outstanding dues tracking.
- **Examinations & Report Cards**: Exam scheduling, grading schemes, mark entry, and printable PDF report cards.
- **Homework & Digital Study Materials**: Assignments submission, grading, and syllabus material downloads.
- **Transport & Vehicle Tracking**: Fleet management, driver details, routes, stops, and transport logs.
- **Hostel & Room Management**: Building allocations, rooms, bed availability, and resident rosters.
- **Library Management**: Book catalogue, barcode/ISBN tracking, issue/return transactions, and fine records.
- **Campus Safety**: Gate pass issuance with QR codes and visitor management logs.
- **Real-Time Communication**: Socket.io announcements, circulars, and instant push/web notifications.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20 LTS recommended)
- **npm**: v9+ or **yarn** / **pnpm**
- **MongoDB**: A running MongoDB instance (or MongoDB Atlas connection string)
- **Android SDK / Xcode** *(only for `parent-app` mobile development)*

---

### 1. Backend Setup (`backend/`)

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Ensure backend/.env exists with:
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/school-erp (or MongoDB Atlas URI)
# JWT_SECRET=your_jwt_secret_key
# NODE_ENV=development

# Seed default Super Admin & initial dataset
npm run seed

# Run in development mode (with hot reload via tsx)
npm run dev
```

*Default Super Admin Credentials (auto-seeded upon boot):*
- **Username:** `admin`
- **Password:** `admin123`
- **API URL:** `http://localhost:5000`

---

### 2. Frontend Web Portals (`frontend/`)

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Verify environment variables in frontend/.env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- `/` – Unified login portal with automatic role-based redirect
- `/admin/*` – Administrative and ERP management portal
- `/teacher/*` – Teacher dashboard, attendance, grading, and assignments
- `/student/*` – Student portal for homework, exams, materials, and fees
- `/parent/*` – Parent web view for monitoring children's progress and fee payments

---

### 3. Parent Mobile App (`parent-app/`)

```bash
# Navigate to parent-app directory
cd parent-app

# Install dependencies
npm install

# Start Metro bundler
npm start

# In a separate terminal, run on Android:
npm run android
```

---

## 📚 Documentation Index

| Document | Purpose |
| :--- | :--- |
| [**`constant.md`**](./constant.md) | **The Memory Anchor**: Immutable domain constants, business rules, fixed targets & ADRs |
| [**`standard.md`**](./standard.md) | **The Enforcement Layer**: Strict code quality, syntax standards, and AI verification checklist |
| [**`AGENTS.md`**](./AGENTS.md) | AI coding instructions, prompt rules, conventions, and guardrails |
| [**`ARCHITECTURE.md`**](./ARCHITECTURE.md) | Technical architecture, ER models, API structure, and real-time flows |
| [**`PRD.md`**](./PRD.md) | Product Requirements Document: user personas, workflows, and module specs |
| [**`TODO.md`**](./TODO.md) | Project status, completed features, and pending backlog tasks |
| [**`backend/README.md`**](./backend/README.md) | Backend API endpoint catalog, database scripts, and server configuration |
| [**`frontend/README.md`**](./frontend/README.md) | Next.js architecture, component patterns, state management, and tests |
| [**`parent-app/README.md`**](./parent-app/README.md) | React Native mobile setup, screens hierarchy, and mobile API client |

---

## 🛡️ Security & Best Practices

- **Authentication**: JWT tokens stored securely in HTTP-only cookies and Authorization Bearer headers.
- **Authorization**: Role-Based Access Control (RBAC) enforced via server-side middleware and frontend route guards.
- **Data Protection**: Passwords securely hashed using `bcryptjs` with salt rounds.
- **Request Safety**: Rate limiting, HTTP security headers powered by `helmet`, CORS validation, and input sanitization.
