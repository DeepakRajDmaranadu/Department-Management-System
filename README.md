# Department Management System (DMS) - Part 1: Auth

This repository contains the complete **Authentication & Authorization** module for the Department DMS, implementing role-based access control, secure JWT-based sessions, automated routing gates, and an enterprise login interface with custom captcha verification.

---

## Technology Stack

### Backend
- **Node.js** & **Express.js**
- **MongoDB** & **Mongoose**
- **Security**: `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`, `cookie-parser`, `zod`

### Frontend
- **React** (Vite + TypeScript)
- **Tailwind CSS** & **shadcn/ui**
- **Routing & Forms**: `React Router v7`, `React Hook Form`, `Zod`
- **Client**: `Axios`

---

## Directory Structure

```
department-dms/
├── backend/
│   ├── config/          # DB Connection
│   ├── controllers/     # Authentication & User Controllers
│   ├── middleware/      # Auth & Role middleware, rate limiting
│   ├── models/          # User Schema
│   ├── routes/          # Express route definitions
│   ├── utils/           # JWT, Bcrypt helpers
│   ├── validators/      # Zod validation schemas
│   ├── .env             # Environment configuration
│   ├── seed.js          # Database Admin seeder
│   └── server.js        # Entry point
└── frontend/
    ├── src/
    │   ├── components/  # UI components (Button, Card, Input, Checkbox, Label)
    │   ├── context/     # Auth Context (State, Login, Logout, Remember Me)
    │   ├── layouts/     # Dashboard layout (Sidebar, Navbar, Profile Dropdown)
    │   ├── pages/       # Login, CaptchaCanvas, DashboardHome
    │   └── services/    # Axios client interceptors
    ├── tailwind.config.js
    ├── postcss.config.js
    └── ...
```

---

## Setup & Running Guide

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **MongoDB** installed and running on your local machine.

---

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. The dependencies are already installed. Check the environment settings in `.env`:
   - `PORT`: Server port (default `5000`)
   - `MONGO_URI`: Connection string (default `mongodb://127.0.0.1:27017/department_dms`)
   - `JWT_SECRET`: Signature key
3. Ensure MongoDB is running, then seed the database with the default Admin account:
   ```bash
   npm run seed
   ```
   *This seeds a default Admin user: **Employee ID:** `ADM001` | **Password:** `Admin@12345`.*
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *(Starts nodemon listening on port 5000)*

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

---

## Features & Verification Steps

### 1. Enterprise Login Page
- **Employee ID & Password**: Custom client-side validation using React Hook Form & Zod.
- **Show/Hide Password Toggle**: Toggle viewable credentials.
- **Custom Captcha**:
  - Generates a random 6-character alphanumeric string.
  - Skews letters and draws grid/noise patterns on an HTML5 canvas to deter basic bots.
  - Implements **Validate before API request** (submitting incorrect Captcha blocks API request immediately, alerts client, and regenerates captcha).
  - Regenerates on any failed API response.
- **Remember Me**: Saves JWT token in local storage for session persistence; if unchecked, JWT resides in standard application memory (or cookie) and clears on tab closure.

### 2. Auto Login after Refresh
- On page load, the frontend validates the session by hitting the `/api/auth/profile` endpoint. If successful, user data is restored automatically.

### 3. Role-Based Redirects
Upon login, users are automatically routed to their role-specific dashboard layouts:
- **Admin** $\rightarrow$ `/dashboard/admin`
- **Principal** $\rightarrow$ `/dashboard/principal`
- **HOD** $\rightarrow$ `/dashboard/hod`
- **Faculty** $\rightarrow$ `/dashboard/faculty`
- **Office Assistant** $\rightarrow$ `/dashboard/office`

### 4. Admin User Creation Endpoint
- Admin users can register other employees directly from the **Dashboard Home** UI panel, which fires a request to `POST /api/users`.
- This endpoint enforces password requirements (minimum 8 characters, uppercase, lowercase, numbers, special characters) and verifies duplicate employee IDs or emails.
- Standard roles do not have permission to view or call this API.

### 5. Profile Dropdown & Password Change
- A customizable profile dropdown allows you to view active session attributes (Name, Role, Email) and open a **Change Password** Modal.
- The Change Password utility verifies the old credentials, checks new password strength using Zod, hashes via bcrypt, and updates the database record.
