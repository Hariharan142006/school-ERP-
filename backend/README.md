# Backend API & Realtime Server (`backend/`)

The core REST API and WebSocket gateway powering the **Aathithiya School ERP**. Built using Express 5, TypeScript, MongoDB (Mongoose), and Socket.io.

---

## 🛠️ Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express 5.2.1
- **Language:** TypeScript 7.0.2 / tsx 4.23
- **Database:** MongoDB via Mongoose 9.9.4
- **Real-Time Engine:** Socket.io 4.8.3
- **Security:** Helmet, CORS, Cookie-Parser, Bcryptjs, JsonWebToken, Express-Rate-Limit
- **Utility:** Compression, Axios, Dotenv

---

## 📁 Directory Structure

```
backend/
├── src/
│   ├── app.ts                  # Express app setup, middlewares & route mounting
│   ├── config/
│   │   ├── db.ts               # MongoDB Mongoose connection handler
│   │   └── env.ts              # Environment variable validation & type mappings
│   ├── controllers/            # Route controllers handling business logic
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT verification & RBAC checks
│   │   └── error.middleware.ts # Global centralized error handler
│   ├── models/                 # Mongoose document schemas & interfaces
│   ├── routes/                 # Express route definitions
│   ├── services/               # Reusable business services (notifications, etc.)
│   └── utils/                  # Utility helpers (asyncHandler, logger, pagination)
├── server.ts                   # Entry point: HTTP & Socket.io server bootstrap + admin seeding
├── start-local-mongo.ts        # Embedded in-memory MongoDB runner for testing
└── tsconfig.json               # TypeScript compiler options
```

---

## ⚡ Environment Variables

Create a `.env` file inside the `backend/` directory:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP Server port | `5000` |
| `MONGO_URI` | MongoDB connection connection string | `mongodb://localhost:27017/school-erp` |
| `JWT_SECRET` | Secret key used to sign and verify JWTs | `your_super_secret_jwt_key` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `BREVO_API_KEY` | Optional Brevo (Sendinblue) API key for emails | `xkeysib-...` |
| `BREVO_SENDER_EMAIL` | Sender email address for automated circulars | `admin@school.com` |

---

## 🚀 Running the Server

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
Seed default roles, academic batches, sample students, teachers, and finance records:
```bash
npm run seed
```

### 3. Development Server
Starts the server with live TypeScript hot-reloading using `tsx`:
```bash
npm run dev
```

### 4. Build & Production Run
```bash
npm run build
npm start
```

---

## 📡 API Endpoint Catalog

All routes are prefixed with `/api`.

### Authentication & Users
- `POST /api/auth/login` – Login with username & password; returns JWT token & user object
- `GET /api/auth/me` – Fetch current authenticated user session
- `POST /api/auth/logout` – Clear auth session / cookie
- `GET /api/users` – List all users (Paginated, filtered)
- `POST /api/users` – Create new user account
- `GET /api/roles` – Retrieve custom roles and permission toggles

### Academic & Student Records
- `GET /api/academic/classes` – Retrieve classes and sections
- `POST /api/academic/classes` – Create new class
- `GET /api/batches` – List batches/sections
- `GET /api/students` – Search and filter student profiles
- `POST /api/students` – Register a new student admission
- `GET /api/staff` – List teachers and administrative staff profiles
- `POST /api/staff` – Create staff record

### Attendance & Examinations
- `GET /api/attendance` – Retrieve attendance records by class/date
- `POST /api/attendance/mark` – Mark student attendance batch
- `GET /api/exams` – List scheduled examinations
- `POST /api/exams` – Create exam timetable
- `GET /api/exams/results` – Retrieve graded marks and report card data
- `POST /api/exams/results` – Record student marks

### Finance & Fees
- `GET /api/finance/records` – List student fee records and dues
- `POST /api/finance/pay` – Process a fee payment transaction and generate receipt
- `GET /api/finance/stats` – Financial revenue, pending balances, and collections summary

### Operations & Facilities
- `GET /api/transport/routes` – List bus routes and vehicle stops
- `POST /api/transport/log` – Record daily driver transport log
- `GET /api/hostels/rooms` – Room allocations and bed capacity status
- `GET /api/library/books` – Library catalog search
- `POST /api/library/issue` – Issue a book to student or staff
- `GET /api/gatepass` – Student gate pass requests and QR passes
- `GET /api/visitors` – Visitor check-in/check-out ledger

### Recovery & System Maintenance
- `GET /api/recovery/trash` – List soft-deleted records across collections
- `POST /api/recovery/restore` – Restore soft-deleted entity
