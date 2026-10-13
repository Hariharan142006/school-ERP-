# Project Roadmap & Task Status (TODO.md)

This document tracks completed features, active developments, and prioritized backlog items across all tiers of the **Aathithiya School ERP**.

---

## 🚀 Status Legend
- [x] **Completed & Verified**
- [/] **In Progress / Partially Implemented**
- [ ] **Pending / Roadmap Item**

---

## 1. Backend (`backend/`)

- [x] Express 5 & TypeScript architecture setup
- [x] MongoDB database connection and configuration via Mongoose
- [x] Environment variable validation (`src/config/env.ts`)
- [x] Super Admin auto-seeding on application boot (`server.ts`)
- [x] Comprehensive sample data seeder (`src/seedSampleData.ts`)
- [x] User Authentication & RBAC middleware (`auth.middleware.ts`)
- [x] Socket.io real-time server integration and room management
- [x] Core Modules & Endpoints:
  - [x] Authentication (`/api/auth`)
  - [x] User Management & Custom Roles (`/api/users`, `/api/roles`)
  - [x] Academic Classes, Batches & Subjects (`/api/academic`, `/api/batches`)
  - [x] Student Profiles (`/api/students`)
  - [x] Staff Profiles (`/api/staff`)
  - [x] Attendance System (`/api/attendance`)
  - [x] Exams & Results (`/api/exams`)
  - [x] Finance, Fees & Payment Transactions (`/api/finance`)
  - [x] Transport Routes, Vehicles & Logs (`/api/transport`)
  - [x] Hostel Rooms & Allocations (`/api/hostels`)
  - [x] Library Books & Issues (`/api/library`)
  - [x] Gate Pass System (`/api/gatepass`)
  - [x] Visitor Log Management (`/api/visitors`)
  - [x] Homework & Study Materials (`/api/homework`, `/api/study-materials`)
  - [x] Notices & Circulars (`/api/notices`, `/api/circulars`)
  - [x] School Calendar & Settings (`/api/calendar`, `/api/settings`)
  - [x] Soft Delete & Data Recovery (`/api/recovery`)
- [/] Integration with external SMS gateways (Fast2SMS / Twilio)
- [/] Real-time GPS device webhook ingestion for vehicle buses
- [ ] Automated scheduled database backups (Cron job to S3/Cloud storage)

---

## 2. Frontend Web Portals (`frontend/`)

- [x] Next.js 16 App Router setup with React 19 & Tailwind CSS v4
- [x] Unified Login Page with role-based dashboard redirection
- [x] Zustand Authentication Store (`authStore.ts`) & Cookie session handling
- [x] TanStack Query Client provider (`QueryProvider.tsx`)
- [x] Global dark/light theme context (`ThemeContext.tsx`)
- [x] Atomic design component architecture (`atoms`, `molecules`, `organisms`)
- [x] Admin Portal Pages:
  - [x] Overview Dashboard (`/admin/dashboard`)
  - [x] Students Roster & Admissions (`/admin/students`)
  - [x] Staff Management (`/admin/staff`)
  - [x] Academic Setup (`/admin/academic`)
  - [x] Attendance Reports (`/admin/attendance`)
  - [x] Fee Records & Payment Receipts (`/admin/finance`)
  - [x] Examination Management (`/admin/exam`)
  - [x] Transport Management (`/admin/transport`)
  - [x] Hostel Management (`/admin/hostel`)
  - [x] Library Book Catalogue (`/admin/library`)
  - [x] Gate Pass & Visitor Log (`/admin/gate-pass`, `/admin/visitor`)
  - [x] Circulars & Notice Board (`/admin/circular`, `/admin/fee-notice`)
  - [x] Data Recovery & Trash Bin (`/admin/recovery`)
- [x] Teacher Portal (`/teacher/*`):
  - [x] Class Attendance Marking
  - [x] Homework Posting & Submissions Review
  - [x] Exam Mark Entry & Results
  - [x] Teacher Profile & Timetable
- [x] Student Portal (`/student/*`):
  - [x] Student Dashboard & Timetable
  - [x] Homework Downloads
  - [x] Exam Schedules & Results View
  - [x] Library Issued Books & Fees
- [x] Parent Portal (`/parent/*`):
  - [x] Children Overview Dashboard
  - [x] Attendance Calendar View
  - [x] Fee Due Status & Payment Receipts
  - [x] Bus Location & Transport Info
- [x] Playwright E2E Test Suite setup (`e2e/auth.spec.ts`, `e2e/finance.spec.ts`, etc.)
- [/] Payment Gateway Checkout integration (Razorpay / Stripe)
- [ ] Excel bulk import for student and staff records

---

## 3. Parent Mobile App (`parent-app/`)

- [x] React Native 0.72 setup with TypeScript
- [x] React Navigation structure (RootNavigator + BottomTabNavigator)
- [x] Axios HTTP client configured with AsyncStorage token interceptor (`api.ts`)
- [x] Parent Login Screen (`LoginScreen.tsx`)
- [x] Core Mobile Screens:
  - [x] Dashboard Screen (`DashboardScreen.tsx`)
  - [x] Attendance Calendar Screen (`AttendanceScreen.tsx`)
  - [x] Academic & Timetable Screen (`AcademicScreen.tsx`, `TimetableScreen.tsx`)
  - [x] Fee Summary & Dues (`FeesScreen.tsx`)
  - [x] Homework Screen (`HomeworkScreen.tsx`)
  - [x] Leave Application Screen (`LeaveScreen.tsx`)
  - [x] Transport Tracking Screen (`TransportScreen.tsx`)
  - [x] Announcements & Circulars (`AnnouncementsScreen.tsx`)
  - [x] Profile Screen (`ProfileScreen.tsx`)
- [/] Push Notifications configuration via Firebase Cloud Messaging (FCM)
- [ ] In-app PDF receipt viewer/downloader
- [ ] Biometric login (Fingerprint / Face ID) via `react-native-keychain`
