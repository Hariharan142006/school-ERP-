# Product Requirements Document (PRD.md)

**Project Name:** Aathithiya School ERP  
**Product Version:** 1.0.0  
**Target Audience:** K-12 Educational Institutions, School Boards, Teachers, Students, and Parents  

---

## 1. Executive Summary & Objective

**Aathithiya School ERP** is a centralized, cloud-ready educational resource planning platform engineered to streamline school administration, digitize academic records, bridge parent-teacher communication, and ensure student safety. 

### Core Goals:
- Eliminate manual paperwork across administrative, financial, and academic departments.
- Deliver transparent, real-time student tracking for parents (attendance, fees, bus transport).
- Empower teachers with simplified grading, attendance marking, and homework assignment tools.
- Provide institutional leadership with real-time financial, demographic, and operational metrics.

---

## 2. User Personas & Permissions

| Persona | Primary Needs & Workflows | Access Boundaries |
| :--- | :--- | :--- |
| **Super Admin** | Full governance over all school entities, system configuration, user role provisioning, financial audits, and database backups. | Unrestricted global access (`SUPER_ADMIN`). |
| **Sub Admin / Office Staff** | Day-to-day operations: student admissions, fee collections, visitor gate passes, staff payroll, inventory stocks. | Permission-gated role (`SUB_ADMIN` / custom roles). |
| **Teacher / Faculty** | Marking period attendance, uploading study materials, managing homework, entering exam marks, recording student remarks. | Class & subject-specific access (`TEACHER`). |
| **Student** | Viewing timetables, reviewing assignment deadlines, downloading materials, viewing exam marks, tracking library books. | Self-profile and academic records only (`STUDENT`). |
| **Parent** | Monitoring student attendance, paying tuition fees, tracking the school bus, applying for student leaves, communicating with teachers. | Linked children's records only (`PARENT`). |

---

## 3. Module Specifications & Requirements

### 3.1 Authentication & User Management
- **FR-AUTH-1:** Unified authentication supporting username/email and password.
- **FR-AUTH-2:** Role-based access control (RBAC) redirecting users to appropriate dashboards on login.
- **FR-AUTH-3:** Password encryption via `bcryptjs` and session issuance via secure JWTs.
- **FR-AUTH-4:** Custom sub-admin roles with permission toggles (e.g., Finance Only, Library Only).

### 3.2 Academic Management
- **FR-ACAD-1:** Define academic years, class standards (e.g., Grade 1 to 12), and section batches (e.g., A, B, C).
- **FR-ACAD-2:** Subject directory mapping (Core, Elective, Practical) with assigned teachers.
- **FR-ACAD-3:** Timetable generator supporting period slots, days of the week, and conflict checks.

### 3.3 Student Information System (SIS)
- **FR-STUD-1:** Comprehensive student profiles: admission number, roll number, DOB, blood group, parent linkage.
- **FR-STUD-2:** Student document upload and historical academic records.
- **FR-STUD-3:** Search and filter students by grade, batch, status, or admission number.

### 3.4 Staff & Faculty Management
- **FR-STAF-1:** Teacher profiles with qualification details, employee ID, assigned subjects, and contact records.
- **FR-STAF-2:** Staff attendance tracking and leave management with admin approval workflows.

### 3.5 Daily Attendance Management
- **FR-ATT-1:** Quick attendance marking interface for class teachers (Present, Absent, Late, Excused).
- **FR-ATT-2:** Instant alert dispatch to parents when a student is marked Absent.
- **FR-ATT-3:** Monthly attendance percentage calculations and exportable summary sheets.

### 3.6 Finance, Tuition & Fee Collection
- **FR-FEE-1:** Configurable fee heads (Term Fee, Tuition Fee, Transport Fee, Hostel Fee, Lab Fee).
- **FR-FEE-2:** Support for full and partial payments, generating unique receipt numbers.
- **FR-FEE-3:** Outstanding balance tracking with due dates and overdue statuses.
- **FR-FEE-4:** Payment modes supported: Cash, Credit/Debit Card, UPI, Bank Transfer, and Online Payment.
- **FR-FEE-5:** Printable PDF fee receipts and financial collection reports.

### 3.7 Examination & Report Cards
- **FR-EXAM-1:** Exam schedule setup (Quarterly, Half-Yearly, Annual, Unit Tests).
- **FR-EXAM-2:** Grade and mark entry sheets per subject.
- **FR-EXAM-3:** Automated GPA/percentage calculation, rank determination, and PDF report card generation.

### 3.8 Transport & Fleet Tracking
- **FR-TRANS-1:** Bus vehicle management (Vehicle number, capacity, driver, contact, route).
- **FR-TRANS-2:** Bus route stops with pickup and drop timings.
- **FR-TRANS-3:** Transport log entries and live coordinate sharing for parent tracking.

### 3.9 Hostel Management
- **FR-HOST-1:** Room and block inventory management with bed capacity limits.
- **FR-HOST-2:** Student room allocations and checkout status.

### 3.10 Library Management
- **FR-LIB-1:** Book cataloging by ISBN, title, author, category, and shelf location.
- **FR-LIB-2:** Book issue, renewal, and return transaction tracking with overdue fine calculations.

### 3.11 Campus Safety: Gate Pass & Visitor Tracking
- **FR-SAFE-1:** Digital Gate Pass issuance for students leaving campus early, requiring parent/admin sign-off.
- **FR-SAFE-2:** Visitor check-in/check-out ledger capturing visitor name, phone, purpose, and entry/exit timestamps.

---

## 4. Non-Functional Requirements (NFR)

- **Performance:** API endpoints must respond within 300ms under standard loads.
- **Security:** Strict CORS, Helmet security headers, password hashing, and token validation.
- **Data Integrity:** Soft deletes (`isDeleted`) for critical records (Users, Students, Fees) to avoid accidental permanent data loss.
- **Mobile Usability:** Parent mobile app responsive on screen sizes from 4.7" to 6.8" on Android and iOS.
- **Extensibility:** REST API routes partitioned modularly to support easy addition of third-party integrations (SMS gateways, payment gateways, biometric devices).
