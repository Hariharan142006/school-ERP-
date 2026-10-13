# Frontend Web Portals (`frontend/`)

The official web frontend for the **Aathithiya School ERP**, built using **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**. It delivers role-tailored dashboards and management interfaces for Administrators, Teachers, Students, and Parents.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16.3.3 (App Router)
- **Library:** React 19.2.8 & React DOM
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4, PostCSS
- **State Management:** Zustand 5.0.15 (Auth & user persistence)
- **Data Fetching:** TanStack React Query 5.102 (Server state & cache)
- **Icons & UI:** Lucide React, Sonner (Toast alerts), Framer Motion
- **Export Utilities:** jsPDF, html2canvas (Report cards, fee receipts)
- **Testing:** Playwright 1.62 (End-to-end browser tests)

---

## 📁 Directory Structure

```
frontend/src/
├── app/
│   ├── (auth)/                 # Public auth pages & landing
│   ├── admin/                  # Super Admin & Office Management Portals
│   │   ├── academic/           # Classes, Batches, Subjects setup
│   │   ├── attendance/         # School-wide attendance registers
│   │   ├── circular/           # Circulars & Announcements publisher
│   │   ├── dashboard/          # Metrics, trends, KPIs
│   │   ├── exam/               # Examination schedules & mark sheets
│   │   ├── finance/            # Fee collection & payment receipts
│   │   ├── gate-pass/          # Digital security gate passes
│   │   ├── hostel/             # Dormitory rooms & bed allocations
│   │   ├── library/            # Book catalogue & issue ledger
│   │   ├── recovery/           # Data recovery & trash bin
│   │   ├── staff/              # Faculty & staff directory
│   │   ├── students/           # Student admissions & profiles
│   │   ├── transport/          # Fleet, routes & vehicle logs
│   │   └── visitor/            # Campus visitor registry
│   ├── teacher/                # Faculty workflows (attendance, grading, homework)
│   ├── student/                # Student portal (assignments, timetable, marks)
│   ├── parent/                 # Parent web overview (fee pay, bus info, leaves)
│   ├── layout.tsx              # Root HTML & body structure
│   ├── globals.css             # Tailwind CSS imports & theme variables
│   └── page.tsx                # Unified login router
├── components/
│   ├── atoms/                  # Buttons, badges, input controls, chips
│   ├── molecules/              # Stat cards, search bars, filter groups
│   ├── organisms/              # Data tables, navigation bars, modals
│   └── templates/              # Base dashboard templates & report layouts
├── context/
│   └── ThemeContext.tsx        # Dark/light theme provider
├── hooks/
│   ├── useAuth.ts              # Authentication state helper hook
│   └── useApi.ts               # React Query API interaction hooks
├── lib/
│   ├── axios.ts                # Configured Axios instance with interceptors
│   ├── exportUtils.ts          # PDF/Excel report export functions
│   └── validation.ts           # Form validation schemas
├── providers/
│   └── QueryProvider.tsx       # TanStack Query Client provider wrapper
├── store/
│   └── authStore.ts            # Zustand global authentication store
└── types/
    └── index.ts                # TypeScript interfaces and DTOs
```

---

## ⚡ Environment Variables

Create `.env.local` inside `frontend/`:

```env
# URL pointing to the running backend API server
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Run the development server with hot-reload:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

### 4. Running End-to-End Tests
Playwright tests are configured in `playwright.config.ts` and `e2e/`:
```bash
# Run all E2E tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui

# View latest HTML test report
npx playwright show-report
```

---

## 🔐 Role-Based Portals

| Route Prefix | Target Persona | Key Capabilities |
| :--- | :--- | :--- |
| `/admin/*` | Super Admin / Staff | Admissions, Fee Collection, Fleet Tracking, Staff Directory, Gate Pass |
| `/teacher/*` | Teachers | Class Attendance Marking, Marks Entry, Homework Assignment |
| `/student/*` | Students | Timetable, Download Study Materials, View Exam Marks, Due Fees |
| `/parent/*` | Parents | Monitor Children, View Attendance Calendar, Pay Tuition, Bus Info |
