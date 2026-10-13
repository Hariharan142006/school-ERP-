# Immutable Project Constants (constant.md)

> **Role: The Memory Anchor (The "What Is")**  
> This file contains the immutable truths, permanent business logic, fixed environmental targets, architectural decisions, and current functional inventory of **Aathithiya School ERP**.  
> **Rule for AI Agents:** Check this file prior to refactoring, adding routes, or modifying database schemas. Do not alter or violate these domain constants unless explicitly instructed by the user.

---

## 1. Core Domain Constants & Business Logic

### 1.1 Fixed User Roles
The application strictly supports 5 primary user roles. These strings are immutable across backend, frontend, and mobile clients:
```typescript
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUB_ADMIN   = 'SUB_ADMIN',
  TEACHER     = 'TEACHER',
  STUDENT     = 'STUDENT',
  PARENT      = 'PARENT'
}
```

### 1.2 Attendance Status Values
Daily and subject attendance records use strictly defined states:
- `Present`
- `Absent`
- `Late`
- `Half-Day`
- `Excused`

### 1.3 Fee & Payment Constants
- **Fee Payment Statuses:** `Pending`, `Partial`, `Paid`, `Overdue`.
- **Supported Payment Modes:** `Cash`, `Card`, `UPI`, `Bank Transfer`, `Online`.
- **Financial Immutability Rule:** Once a fee transaction receipt is generated, the ledger transaction (`IPaymentTransaction`) is permanent and cannot be modified or dropped. Only new adjustments or payment records may be appended.

### 1.4 Soft Delete Invariant
- **No Hard Deletes on Critical Entities:** Records in `User`, `StudentProfile`, `StaffProfile`, `FeeRecord`, `Exam`, and `Class` must use soft deletion.
- Required fields on soft-deletable schemas:
  - `isDeleted: { type: Boolean, default: false }`
  - `deletedAt: { type: Date }`
- Queries must filter out deleted items by default (`{ isDeleted: { $ne: true } }`), with soft-deleted items managed exclusively via `/api/recovery`.

---

## 2. System Environmental Targets & Network Anchors

| Target Parameter | Value | Scope | Notes |
| :--- | :--- | :--- | :--- |
| **Backend REST Port** | `5000` | Local / Dev Server | Configured in `backend/.env` |
| **Frontend Web Port** | `3000` | Local / Dev Server | Next.js default server |
| **API Path Prefix** | `/api` | Global Gateway | All backend endpoints must live under `/api/*` |
| **Health Check Route** | `GET /api/health` | Backend Gateway | Returns `{ status: 'ok', uptime }` |
| **Root Welcome Route** | `GET /` | Backend Gateway | Returns API metadata JSON |
| **Mobile Auth Token Key** | `'parent_token'` | AsyncStorage | Storage key for Parent React Native app |
| **Password Hashing** | `bcryptjs` (salt 10) | User Pre-Save Hook | Raw passwords must never be persisted |

---

## 3. Unchanging Architectural Boundaries

1. **Strict Monorepo Isolation:**
   - The three packages (`backend/`, `frontend/`, `parent-app/`) are completely independent runtimes.
   - **Never** import files across package boundaries (e.g., do not import from `../../backend` inside `frontend` or `parent-app`). All inter-app communication occurs over standard HTTP REST requests or Socket.io WebSockets.

2. **Authentication Flow & Session Target:**
   - **Web Portals:** Session is maintained via JWT tokens stored in HTTP-Only cookies and Authorization Bearer headers.
   - **Parent Mobile App:** Token is stored in React Native `@react-native-async-storage/async-storage` under key `'parent_token'` and attached via Axios request interceptor as `Authorization: Bearer <token>`.
   - Passwords must **never** be returned in API response bodies (always projected out or excluded via `.select('-password')`).

3. **State Management Paradigm:**
   - **Frontend:** Client session and user profile are managed exclusively via **Zustand** (`src/store/authStore.ts`). Server data caching and mutations are managed exclusively via **TanStack React Query**.
   - **Parent App:** Session state is managed via React Context (`AuthContext.tsx`).

4. **Real-Time Communication (Socket.io):**
   - Socket server runs on port `5000` integrated directly with Express HTTP server.
   - Controllers broadcast real-time events via `req.app.get('io')`.

---

## 4. Architectural Decision Records (ADRs)

| ADR ID | Decision Summary | Rationale |
| :--- | :--- | :--- |
| **ADR-001** | Next.js 16 App Router for Web Portals | Enables unified SSR/CSR routing, layouts, and role partitioning under `/admin`, `/teacher`, `/student`, `/parent`. |
| **ADR-002** | React Native CLI (0.72) for Parent App | Native performance, direct access to device sensors, background services, and offline storage for parents. |
| **ADR-003** | Express 5.2 for REST API | Native async route handling without crashing unhandled promise rejections. |
| **ADR-004** | Tailwind CSS v4 for UI Styling | High-performance atomic utility styling without CSS runtime overhead. |
| **ADR-005** | Centralized Recovery Trash Bin | Ensures accidental administrative deletions can be restored safely without direct database access. |

---

## 5. Current Implemented Features (System Capabilities)

### 5.1 Identity, Access & Custom Roles
- **Dual Identifier Login:** Login using either `username` or `email` with password.
- **Role Redirection:** Automatic landing routing based on user role (`SUPER_ADMIN`, `SUB_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`).
- **Dynamic Granular RBAC:** Custom role definitions with permission matrix toggles (`Role` collection) attached to Sub-Admins.
- **Auto-Seeded Super Admin:** Automatic validation and creation of default `admin` / `admin123` on boot.

### 5.2 Academic Structure & Timetable
- **Classes & Sections:** Class hierarchy management with section batches (`Batch` collection).
- **Curriculum & Subjects:** Subject cataloging with type classification (Core, Elective, Practical).
- **Timetable Scheduling:** Weekly period grids mapping days, time slots, subjects, and assigned teachers.
- **Teacher-Specific Timetables:** Direct query for faculty daily teaching periods.

### 5.3 Student & Staff Information System (SIS)
- **Student Roster & Admissions:** Demographic profiles, roll numbers, admission codes, blood group, and guardian associations.
- **Parent Linkage:** Multi-child support linking parent accounts directly to student profiles (`addOrUpdateParent`).
- **Bulk CSV/JSON Importers:** Batch user creation supporting up to thousands of student and staff records.
- **Staff Directory:** Teacher profiles, qualification history, employee IDs, and assigned subjects.

### 5.4 Daily & Period Attendance Tracking
- **Batch Attendance Marking:** Teacher/Admin marking for entire class sections with attendance status (`Present`, `Absent`, `Late`, `Half-Day`, `Excused`).
- **Personalized Student Attendance:** Historical attendance lookup by date range with percentage calculation.
- **Real-Time Attendance Alerts:** Instant parent alert generation when student is marked Absent.

### 5.5 Finance & Fee Management
- **Configurable Fee Heads:** Tuition, Term, Transport, and Hostel fee allocations.
- **Multi-Mode Partial Payments:** Cash, UPI, Card, Net Banking collections with automatic balance recalculation (`paidAmount`, `balanceAmount`, `dueDate`).
- **Receipt Generation:** Unique receipt numbering (`receiptNumber`), cash received/change calculation, and PDF export.
- **Financial Statistics:** Aggregate collections, outstanding balances, and pending dues by grade.

### 5.6 Examinations & Digital Report Cards
- **Exam Scheduling:** Exam scheduling by term/subject with date, time, maximum marks, and passing criteria.
- **Mark Sheet Entry:** Subject-wise grading, scored marks, and teacher remarks.
- **Automated Results & GPA:** Calculation of percentages, rank, and printable report cards.

### 5.7 Homework & Study Materials
- **Homework Assignment Dispatch:** Class-specific assignment posting with description, subject, and deadline.
- **Digital Study Materials:** Repository for notes, syllabus outlines, and downloadable files.

### 5.8 Transport & Fleet Management
- **Vehicle Directory:** Bus registration numbers, vehicle capacity, driver contact, and route names.
- **Route Student Allocation:** Assigning students to specific buses and pickup/drop stops.
- **Driver Transport Logs:** Daily journey start/finish logs and status broadcasts (`notifyBusStatus`).

### 5.9 Hostel & Boarding Facilities
- **Room & Bed Capacity:** Room inventory tracking with total beds, occupancy, and room types.
- **Student Allocation:** Digital check-in and checkout of hostel boarders.

### 5.10 Library Circulation System
- **Book Catalogue:** ISBN, title, author, category, copies count, and shelf rack locations.
- **Circulation Ledger:** Book issue and return workflows with overdue date tracking and fine calculation.

### 5.11 Campus Safety (Gate Pass & Visitors)
- **Digital Gate Passes:** Student early leave/checkout passes with QR code generation and approval tracking.
- **Visitor Registry:** Visitor check-in/out logging with visitor name, phone, purpose, and entry/exit timestamps.

### 5.12 Communications & Notifications
- **Circulars & Notices:** Publishing announcements with target audience filters (`ALL`, `TEACHER`, `STUDENT`, `PARENT`).
- **Transactional Notifications:** Brevo integration for automated transactional emails and SMS alerts (`notificationService.ts`).
- **School Calendar:** Academic year calendar events, holidays, and examination milestones.

### 5.13 Data Recovery & Recycle Bin
- **Trash Bin Overview:** Query soft-deleted items across `StudentProfile`, `StaffProfile`, `FeeRecord`, `User`, `Class`.
- **One-Click Restore:** Restores soft-deleted entities back into active status.
- **Permanent Purge:** Hard-delete capability restricted strictly to Super Admins.

---

## 6. Current Implemented Functions (Controller & Service Inventory)

The table below maps all active controllers, their exported functions, HTTP routes, and operational roles:

| Controller File | Exported Function | HTTP Method & Route | Operational Description |
| :--- | :--- | :--- | :--- |
| **`authController.ts`** | `login` | `POST /api/auth/login` | Authenticates username/email & password; sets HTTP-Only cookie and returns JWT |
| | `seedSuperAdmin` | `POST /api/auth/seed` | Seeds or resets default super admin credentials |
| **`academicController.ts`** | `getClasses` | `GET /api/academic/classes` | Fetches all active academic classes and sections |
| | `createClass` | `POST /api/academic/classes` | Creates a new grade/class |
| | `updateClass` | `PUT /api/academic/classes/:id` | Updates class metadata or section list |
| | `deleteClass` | `DELETE /api/academic/classes/:id` | Soft-deletes a class |
| | `getSubjects` | `GET /api/academic/subjects` | Retrieves subject list |
| | `createSubject` | `POST /api/academic/subjects` | Adds new subject to curriculum |
| | `updateSubject` | `PUT /api/academic/subjects/:id` | Modifies subject details |
| | `deleteSubject` | `DELETE /api/academic/subjects/:id` | Deletes subject |
| **`batchController.ts`** | `getBatches` | `GET /api/batches` | Retrieves all section batches |
| | `createBatch` | `POST /api/batches` | Registers a new batch (e.g., Section A) |
| | `deleteBatch` | `DELETE /api/batches/:id` | Removes a section batch |
| **`studentController.ts`** | `getMyProfile` | `GET /api/students/me` | Fetches authenticated student's profile |
| | `getMyChildren` | `GET /api/students/my-children` | Fetches children linked to authenticated parent |
| | `getStudents` | `GET /api/students` | Lists students with class, batch, and search filters |
| | `createStudent` | `POST /api/students` | Enrolls a new student and creates user account |
| | `updateStudent` | `PUT /api/students/:id` | Modifies student profile details |
| | `addOrUpdateParent`| `POST /api/students/:id/parent`| Links parent account to student |
| | `bulkImportStudents`| `POST /api/students/bulk-import`| Bulk creates students from dataset |
| | `deleteStudent` | `DELETE /api/students/:id` | Soft-deletes student profile |
| **`staffController.ts`** | `getStaff` | `GET /api/staff` | Retrieves all faculty and staff profiles |
| | `createStaff` | `POST /api/staff` | Creates staff profile and user credentials |
| | `updateStaff` | `PUT /api/staff/:id` | Modifies staff profile |
| | `bulkImportStaff` | `POST /api/staff/bulk-import` | Bulk imports staff records |
| | `deleteStaff` | `DELETE /api/staff/:id` | Soft-deletes staff record |
| **`attendanceController.ts`**| `getAttendance` | `GET /api/attendance` | Fetches class attendance register by date |
| | `markAttendance` | `POST /api/attendance/mark` | Batch marks student attendance and triggers alerts |
| | `getStudentAttendance`| `GET /api/attendance/student/:id`| Fetches individual student attendance history |
| **`financeController.ts`** | `getFees` | `GET /api/finance/records` | Lists fee records with student and status filters |
| | `createFee` | `POST /api/finance/create` | Allocates a fee head to student(s) |
| | `markFeePaid` | `POST /api/finance/pay` | Records transaction payment, updates balance & receipt |
| | `deleteFee` | `DELETE /api/finance/:id` | Soft-deletes a fee record |
| **`examController.ts`** | `getExams` | `GET /api/exams` | Lists scheduled examinations |
| | `createExam` | `POST /api/exams` | Schedules a new exam |
| | `updateExam` | `PUT /api/exams/:id` | Updates exam schedule |
| | `deleteExam` | `DELETE /api/exams/:id` | Removes scheduled exam |
| | `getExamResults` | `GET /api/exams/:id/results` | Retrieves class results for an exam |
| | `saveExamResults`| `POST /api/exams/:id/results`| Saves student marks and remarks |
| | `getStudentResults`| `GET /api/exams/student/:studentId`| Fetches all exam results for report card |
| **`timetableController.ts`**| `getTimetable` | `GET /api/timetable/class/:classId/:batchId` | Retrieves weekly schedule for a class |
| | `saveTimetable` | `POST /api/timetable/save` | Creates/updates class period timetable |
| | `getTeacherTimetable`| `GET /api/timetable/teacher/:teacherId`| Retrieves teacher's weekly periods |
| | `saveStaffTimetable`| `POST /api/timetable/staff/save`| Saves staff specific period schedule |
| **`homeworkController.ts`** | `getHomework` | `GET /api/homework` | Lists homework filtered by class/date |
| | `createHomework` | `POST /api/homework` | Creates and broadcasts homework assignment |
| | `deleteHomework` | `DELETE /api/homework/:id` | Deletes homework item |
| **`studyMaterialController.ts`**| `getStudyMaterials`| `GET /api/study-materials` | Lists study materials for a subject/class |
| | `createStudyMaterial`| `POST /api/study-materials` | Uploads/registers study material |
| | `deleteStudyMaterial`| `DELETE /api/study-materials/:id` | Removes study material |
| **`transportController.ts`**| `getVehicles` | `GET /api/transport/vehicles` | Lists fleet vehicles, drivers, and routes |
| | `createVehicle` | `POST /api/transport/vehicles` | Adds a new transport vehicle |
| | `deleteVehicle` | `DELETE /api/transport/vehicles/:id`| Removes a vehicle |
| | `allocateStudent`| `POST /api/transport/allocate` | Assigns a student to a vehicle route |
| | `removeStudent` | `POST /api/transport/remove-student`| Removes student from route |
| | `notifyBusStatus`| `POST /api/transport/notify` | Broadcasts bus delay or arrival status |
| | `getTransportLogs`| `GET /api/transport/logs` | Fetches daily vehicle trip logs |
| **`hostelController.ts`** | `getRooms` | `GET /api/hostels/rooms` | Lists rooms with bed availability |
| | `createRoom` | `POST /api/hostels/rooms` | Adds a new hostel room |
| | `deleteRoom` | `DELETE /api/hostels/rooms/:id` | Removes a hostel room |
| | `allocateStudent`| `POST /api/hostels/allocate` | Allocates student to a room bed |
| | `removeStudent` | `POST /api/hostels/remove-student` | Checks out student from room |
| **`libraryController.ts`** | `getBooks` | `GET /api/library/books` | Lists books in library catalogue |
| | `createBook` | `POST /api/library/books` | Adds a new book title and copies |
| | `deleteBook` | `DELETE /api/library/books/:id` | Removes book record |
| | `getIssuedBooks` | `GET /api/library/issued` | Lists currently borrowed books |
| | `issueBook` | `POST /api/library/issue` | Records book checkout to student/staff |
| | `returnBook` | `POST /api/library/return` | Records book check-in and calculates fines |
| **`gatePassController.ts`** | `getGatePasses` | `GET /api/gatepass` | Lists gate pass requests and statuses |
| | `createGatePass` | `POST /api/gatepass` | Submits gate pass request for student |
| | `updateGatePass` | `PUT /api/gatepass/:id` | Approves/rejects pass and logs checkout |
| | `deleteGatePass` | `DELETE /api/gatepass/:id` | Cancels gate pass |
| **`visitorController.ts`** | `getVisitors` | `GET /api/visitors` | Lists campus visitor ledger |
| | `createVisitor` | `POST /api/visitors` | Logs new visitor entry |
| | `updateVisitor` | `PUT /api/visitors/:id` | Logs visitor exit time |
| | `deleteVisitor` | `DELETE /api/visitors/:id` | Removes visitor record |
| **`leaveController.ts`** | `getLeaveRequests`| `GET /api/leave` | Lists student and staff leave requests |
| | `createLeaveRequest`| `POST /api/leave` | Submits a leave application |
| | `updateLeaveStatus`| `PUT /api/leave/:id` | Approves or rejects leave request |
| **`circularController.ts`** | `getCirculars` | `GET /api/circulars` | Lists circulars published for audience |
| | `createCircular` | `POST /api/circulars` | Publishes new circular |
| | `updateCircular` | `PUT /api/circulars/:id` | Modifies existing circular |
| | `deleteCircular` | `DELETE /api/circulars/:id` | Deletes circular |
| **`noticeController.ts`** | `getNotices` | `GET /api/notices` | Lists notice board postings |
| | `createNotice` | `POST /api/notices` | Creates notice board bulletin |
| | `deleteNotice` | `DELETE /api/notices/:id` | Removes notice |
| **`calendarController.ts`** | `getEvents` | `GET /api/calendar` | Lists calendar events and holidays |
| | `createEvent` | `POST /api/calendar` | Adds event to school calendar |
| | `updateEvent` | `PUT /api/calendar/:id` | Updates calendar event |
| | `deleteEvent` | `DELETE /api/calendar/:id` | Deletes event |
| **`roleController.ts`** | `getRoles` | `GET /api/roles` | Lists custom RBAC roles and permissions |
| | `createRole` | `POST /api/roles` | Creates custom role with permission set |
| | `updateRole` | `PUT /api/roles/:id` | Updates permission matrix for role |
| | `deleteRole` | `DELETE /api/roles/:id` | Deletes custom role |
| **`userController.ts`** | `getUsers` | `GET /api/users` | Lists user accounts with role filtering |
| | `createUser` | `POST /api/users` | Creates new user credentials |
| | `updateUser` | `PUT /api/users/:id` | Updates user details or resets password |
| | `deleteUser` | `DELETE /api/users/:id` | Soft-deletes user account |
| **`settingsController.ts`**| `getSettings` | `GET /api/settings` | Retrieves general school settings & metadata |
| | `updateSettings` | `PUT /api/settings` | Updates school profile, logo, and terms |
| **`recoveryController.ts`**| `getDeletedRecords`| `GET /api/recovery/trash` | Retrieves all soft-deleted records across models |
| | `restoreRecord` | `POST /api/recovery/restore` | Restores soft-deleted record back to active |
| | `hardDeleteRecord`| `DELETE /api/recovery/permanent/:id`| Permanently drops soft-deleted document |
| **`dashboardController.ts`**| `getAdminStats` | `GET /api/dashboard/stats` | Aggregates high-level metrics (students, staff, revenue) |
| **`notificationService.ts`**| `sendEmail` | *(Service Helper)* | Sends transactional email via Brevo API |
| | `sendSMS` | *(Service Helper)* | Sends international/domestic SMS via Brevo API |

---

## 7. Current Client Portals & Screen Inventories

### 7.1 Web Portals (`frontend/`)
- **Root / Public:** `/` (Unified Login page with auto-redirect).
- **Admin Portal (`/admin/*`):**
  - `/dashboard`, `/students`, `/staff`, `/academic`, `/attendance`, `/finance`, `/fee-notice`, `/exam`, `/transport`, `/hostel`, `/library`, `/gate-pass`, `/visitor`, `/circular`, `/recovery`, `/reports`, `/school`, `/settings`, `/users`.
- **Teacher Portal (`/teacher/*`):**
  - `/dashboard`, `/attendance`, `/classes`, `/classes/[id]`, `/marks`, `/homework`, `/assignments`, `/materials`, `/timetable`, `/students`, `/leave`, `/salary`, `/communication`, `/profile`.
- **Student Portal (`/student/*`):**
  - `/dashboard`, `/attendance`, `/timetable`, `/homework`, `/materials`, `/exams`, `/results`, `/fees`, `/library`, `/announcements`, `/certificates`, `/leave`, `/profile`.
- **Parent Portal (`/parent/*`):**
  - `/dashboard`, `/children`, `/attendance`, `/timetable`, `/homework`, `/performance`, `/fees`, `/bus`, `/transport`, `/leave`, `/announcements`, `/communication`.

### 7.2 Parent Mobile App (`parent-app/`)
- **Authentication:** `LoginScreen.tsx`
- **Root Bottom Tab & Stack Screens:**
  - `DashboardScreen.tsx` (Child stats overview, notices)
  - `AttendanceScreen.tsx` (Interactive monthly calendar)
  - `AcademicScreen.tsx` (Subjects, teachers & syllabus)
  - `TimetableScreen.tsx` (Daily period schedule)
  - `HomeworkScreen.tsx` (Assignments and tasks)
  - `FeesScreen.tsx` (Upcoming dues, payments, receipts)
  - `LeaveScreen.tsx` (Student leave submission & status)
  - `TransportScreen.tsx` (Bus route, stops & live tracking)
  - `AnnouncementsScreen.tsx` (School circulars)
  - `ProfileScreen.tsx` (Student details & settings)
