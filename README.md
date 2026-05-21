# SaaS HRM System - Development Log

## Backend Architecture Flow

1. **Entry (`server.js`/`app.js`)**: Starts the server and configures global settings.
2. **Routes (`routes/`)**: Defines the API structure and directs traffic.
3. **Middleware (`middleware/`)**: Handles security, role verification, and error catching.
4. **Controllers (`controller/`)**: Contains the core business logic and database interactions.
5. **Config & Utils (`config/`/`utils/`)**: Provides the database connection and helper functions.


## Phase 1: Database & Backend Initialization

Establishing the foundation for the HRM system.

### 1. Project Infrastructure
*   **.gitignore**: Added to prevent tracking of `node_modules`, `.env`, and other non-source files.
*   **Error Handling**: Implemented a global error handling system to standardize API responses and prevent server crashes.

### 2. Dependencies
| Dependency | Purpose | Why it's required |
| :--- | :--- | :--- |
| **express** | Web Framework | The backbone of our API, handling requests and routing. |
| **pg** | PostgreSQL Client | Provides the driver and connection pooling for database interactions. |
| **dotenv** | Environment Management | Securely loads environment-specific secrets from `.env`. |
| **cors** | Security | Critical for allowing the frontend to access the API across different origins. |
| **bcryptjs** | Hashing | Safely encrypts passwords before storing them in the DB. |
| **jsonwebtoken** | Access Tokens | Generates a signed "passport" (JWT) for user sessions. |
| **nodemon** | Dev Tool | Automatically reloads the server on changes. |

---

### 3. Database Connection (`backend/src/config/db.js`)

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
```
*   **Line-by-Line**:
    *   `new Pool(...)`: Uses connection pooling, allowing multiple users to share a set of connections. This is more efficient than opening a new connection for every request.
    *   `pool.on('error', ...)`: Captures fatal DB errors on idle connections to prevent the app from hanging.
    *   `exports.query`: A shorthand method to run SQL queries without manually acquiring a client from the pool.

---

### 4. Server Logic (`backend/src/server.js`)
*   **`startServer()`**: An async function that tests the DB connection with `SELECT NOW()` before starting the HTTP listener. This ensures the app doesn't start in a broken state.

---

## Phase 1 (Step 2): Authentication & RBAC

The platform uses JWT and role-based middleware to secure access.

### 1. Security Utilities
*   **`passwordUtils.js`**: Contains `hashPassword` (encrypts passwords) and `comparePassword` (verifies them).
*   **`jwtUtils.js`**: Signs tokens with a 24-hour expiration.

### 2. Controller Logic (`authController.js`)
*   **`exports.login`**: Wrapped in `asyncHandler`. It validates email/password, fetches the user, verifies the hash, and returns a signed token.

### 3. Middleware (`authMiddleware.js`)
*   **`protect`**: Verifies the `Authorization: Bearer <token>` header.
*   **`authorize`**: A higher-order function that restricts routes to specific roles (e.g., `super_admin`).

---

## Phase 2: Super Admin (Company & Subscription Management)

We implemented the multi-tenant core by allowing the Super Admin to manage companies and their licenses.

### 1. Clean Code Refactoring (`asyncHandler`)
*   **`middleware/errorMiddleware.js`**: Contains a wrapper that automatically catches errors in async functions. This removed the need for repetitive `try/catch` blocks in all controllers.

### 2. Company Management (`companyController.js`)
*   **`createCompany`**: Onboards a new tenant organization.
*   **`getAllCompanies`**: Lists all tenants for the Super Admin dashboard.
*   **`updateCompany` & `deleteCompany`**: Manage tenant lifecycle.

### 3. Subscription Management (`subscriptionController.js`)
*   **`createSubscription`**: Assigns a plan (Starter, Pro, etc.) and duration to a company.
*   **`getCompanySubscriptions`**: Provides a history of a tenant's licensing.
*   **`updateSubscription`**: Handles license extensions and status changes.

---

## Phase 2 (Technical Details - RBAC)

| Route | Method | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public | Authenticates user and returns JWT. |
| `/api/companies` | POST/GET | Super Admin | Manage tenant organizations. |
| `/api/subscriptions`| POST/PUT | Super Admin | Manage company licensing. |

---

## Phase 3: Manager Flow (Employee Management)

We implemented the multi-tenant logic for organization managers to handle their own staff.

### 1. Multi-Tenant Isolation
The core of this phase is ensuring that a Manager from "Company A" can never see or modify employees from "Company B". This is enforced in the **`employeeController.js`**:
*   **Source of Truth**: We extract the `company_id` directly from the user's JWT (`req.user.company_id`).
*   **Strict Queries**: Every SQL query (`SELECT`, `UPDATE`, `DELETE`) includes a `WHERE company_id = $1` clause to prevent cross-tenant data leaks.

### 2. Employee Operations
*   **`addEmployee`**: Hashes the new employee's password and links them to the Manager's company.
*   **`getCompanyEmployees`**: Returns only the staff belonging to the logged-in user's organization.
*   **`updateEmployee` & `deleteEmployee`**: Standard CRUD, also protected by `company_id` verification.

### 3. Route Protection (`employeeRoutes.js`)
*   **Access Control**: 
    ```javascript
    router.use(protect, authorize('manager', 'super_admin'));
    ```
    Only Managers and Super Admins can access these staff management tools.

---

## Phase 3 (Step 2): Attendance Flow

We implemented the core time-tracking engine for Employees and Managers.

### 1. Attendance Logic (`attendanceController.js`)
*   **`checkIn`**:
    *   **Prevention**: Checks for existing active sessions to prevent double check-ins.
    *   **IP Capture**: Captures the `req.ip` for security auditing and location verification.
*   **`checkOut`**:
    *   **Dynamic Calculation**: Uses JavaScript `Date` objects to calculate the exact working hours (to two decimal places) between check-in and check-out.
    *   **Record Update**: Closes the active session and stores the `total_hours`.
*   **`getCompanyAttendance`**: Uses a SQL `JOIN` to fetch attendance logs along with employee names, filtered by the Manager's `company_id`.

### 2. Role-Based Access (`attendanceRoutes.js`)
*   **Employee Endpoints**: `POST /check-in`, `POST /check-out`, and `GET /me`.
*   **Manager Endpoints**: `GET /company` for platform-wide reporting.

| Route | Method | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/api/attendance/check-in` | POST | Employee | Starts a working session. |
| `/api/attendance/check-out` | POST | Employee | Ends a session and calculates hours. |
| `/api/attendance/me` | GET | Employee | View personal log history. |
| `/api/attendance/company` | GET | Manager | View organization-wide logs. |

---

## Phase 4: Employee (Self Features)

We implemented personal workspace features allowing employees to manage their own data securely.

### 1. Profile Management (`userController.js`)
*   **Security by Design**: Users do not pass an `id` in the URL to fetch their profile. Instead, the server uses the `req.user.id` from the decoded JWT. This makes it impossible for one user to "guess" another user's ID and steal their data.
*   **`updateProfile`**: Allows users to update their display name and change their password. Password updates are automatically hashed before being saved.

### 2. Routes (`userRoutes.js`)
*   All endpoints are mounted under `/api/users`.
*   Requires valid authentication (`protect`).

| Route | Method | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/api/users/profile` | GET | Authenticated | Fetch your own user profile. |
| `/api/users/profile` | PUT | Authenticated | Update your name or password. |

---

## Phase 5: Leave Management

We implemented a workflow for submitting and approving time-off requests.

### 1. Request Flow (`leaveController.js`)
*   **Application**: Employees can submit requests with a type (Sick, Vacation, etc.) and date range. The system automatically calculates and validates the dates.
*   **Approval Engine**: Managers can view a dashboard of all requests within their company.
*   **Security Join**: The `updateLeaveStatus` uses a SQL `FROM` clause to join `leave_requests` with `users`. This ensures a Manager can only approve requests from their own company, preventing cross-tenant manipulation.

### 2. Routes (`leaveRoutes.js`)
*   **Role Separation**: 
    *   Employees can only `POST` (apply) and `GET /me` (view history).
    *   Managers/Admins can `GET /company` (overview) and `PUT /:id/status` (approve/reject).

| Route | Method | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/api/leaves` | POST | Employee | Apply for new leave. |
| `/api/leaves/me` | GET | Employee | View personal leave history. |
| `/api/leaves/company` | GET | Manager | View organization-wide requests. |
| `/api/leaves/:id/status` | PUT | Manager | Approve or reject a request. |

---

## Phase 6: Reporting & Analytics

We implemented summary statistics to power the dashboards for Super Admins and Managers.

### 1. Dashboard Aggregations (`reportController.js`)
*   **Performance First**: Instead of fetching thousands of records and counting them in Node.js, we use **Subqueries** and **Aggregations** directly in PostgreSQL. This allows the server to return complex stats in a few milliseconds.
*   **Super Admin Stats**: Provides a platform health check (Total companies, active subscriptions, total users).
*   **Manager Stats**: Provides a daily operational snapshot (Employees present today, pending leave requests, and total working hours for the current month).

### 2. Routes (`reportRoutes.js`)
*   **Platform Dashboard**: `/api/reports/super-admin`
*   **Company Dashboard**: `/api/reports/manager`

| Route | Method | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/api/reports/super-admin` | GET | Super Admin | Platform-wide metrics. |
| `/api/reports/manager` | GET | Manager | Organization-specific metrics. |

---

## Phase 7: Holidays & Announcements

We implemented communication and scheduling modules to keep the company informed.

### 1. Holiday Management (`holidayController.js`)
*   **Company Calendar**: Managers can define holidays specific to their organization.
*   **Employee View**: All employees can fetch the holiday list for planning.

### 2. Announcement Board (`announcementController.js`)
*   **Internal News**: A "Digital Notice Board" where Managers can post updates, policy changes, or news.
*   **Access Control**: All employees have read-only access, while Managers and Super Admins have full management capabilities.

| Route | Method | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/api/holidays` | GET | Authenticated | View company holiday list. |
| `/api/holidays` | POST | Manager | Add a new holiday. |
| `/api/announcements` | GET | Authenticated | View company news. |
| `/api/announcements` | POST | Manager | Post a new announcement. |
