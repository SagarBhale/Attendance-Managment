# AttendIQ — Full-Stack MERN Attendance Management System

A production-ready Full-Stack Attendance Management System built using the MERN stack with **live camera selfie verification**, **GPS location tracking**, **Role-Based Access Control (RBAC)**, **Overtime Workflows**, **Attendance Validation**, and **Real-Time Notifications via Socket.IO**.

---

## 🚀 Features Implemented

### 1. 🔐 Authentication & Role-Based Access Control (RBAC)
- JWT-based authentication with secure password hashing via `bcryptjs`.
- 3 User Roles:
  - **Employee**: Can punch in/out with live selfie + location, track personal attendance, and request overtime.
  - **Manager**: Can view team attendance, validate employee selfies/attendance records, and approve/reject overtime requests.
  - **Admin**: System-wide access to monitor all users, edit user roles/departments, validate attendance, and view global reports.
- Client-side and server-side protected routes.

### 2. 📸 Attendance Tracking (Punch In / Punch Out)
- **Live Selfie Capture**: Strictly uses browser camera feed (Webcam stream). File uploads are disabled to prevent fraud.
- **GPS Location Capture**: Automatically retrieves latitude and longitude on punch.
- **Geofencing (Bonus)**: Automatically checks if employee's GPS coordinates are within configurable office radius (`GEO_LAT`, `GEO_LNG`, `GEO_RADIUS_METERS`).
- Stores punch-in time, punch-out time, selfie images (Base64 string), location, and calculates decimal working hours.

### 3. ⏳ Working Hours & Shift Logic
- Standard shift: **8 Hours**.
- **Completed**: Total working hours $\ge 8$ hours.
- **Incomplete**: Total working hours $< 8$ hours.

### 4. ⌛ Overtime (OT) Request Workflow
- Employees can submit an overtime request attached to any completed/incomplete shift.
- Managers/Admins receive notifications and can **Approve** or **Reject** with review notes.
- Real-time notification dispatched to the employee upon review via Socket.IO.

### 5. 🛡️ Attendance Validation & Anti-Spoofing
- Managers/Admins can view full-screen high-res selfies captured at punch-in and punch-out.
- Verify authenticity and mark records as **Valid** or **Invalid (fake/suspicious)**.
- Attach mandatory remarks/notes when invalidating.

### 6. 📊 Reports & Data Export
- Filterable daily/range reports by date and user.
- Export options:
  - **PDF Export** (via `jsPDF`)
  - **Excel Export** (via `xlsx`)
- Access levels strictly enforced (Employee $\rightarrow$ Own data, Manager $\rightarrow$ Team data, Admin $\rightarrow$ All data).

### 7. 🎁 Bonus Features Implemented
- 🌓 **Dark Mode / Light Mode Toggle**: Built-in CSS custom property theme switcher.
- 📍 **Geofencing**: Automatic distance check using the Haversine formula.
- ⚡ **Real-time Updates**: Powered by Socket.IO for instant punch alerts & overtime status updates.
- 📱 **Fully Responsive UI**: Modern glassmorphism dark theme with sleek animations.

---

## 🛠️ Tech Stack Requirements & Architecture

- **Frontend**: React 19 (Vite), Redux Toolkit + RTK Query, React Router v7, React-Webcam, Lucide Icons, Socket.IO Client, jsPDF, XLSX, React-Hot-Toast.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, Winston (Logger), Morgan (HTTP Logger), JWT.
- **Database**: MongoDB.

```
D-Table/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Winston Logger setup
│   │   ├── controllers/     # Auth, Attendance, Overtime, Reports, Users logic
│   │   ├── middleware/      # JWT auth, RBAC, Error Handler
│   │   ├── models/          # User, Attendance, OvertimeRequest schemas
│   │   ├── routes/          # API Endpoint routers
│   │   ├── socket/          # Socket.IO room setup & event handlers
│   │   └── utils/           # Haversine distance, date formatters
│   ├── server.js            # Express app & Socket server
│   ├── seed.js              # Database seed script for quick testing
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/             # Redux Store configuration
    │   ├── components/      # Sidebar, Header, CameraCapture, SelfieThumb, StatusBadge
    │   ├── features/        # RTK Query slices (authApi, attendanceApi, overtimeApi, etc.)
    │   ├── hooks/           # useGeolocation, useSocket
    │   ├── pages/           # Dashboard, Login, Register, Attendance, Overtime, Validate, Reports, Users
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css        # CSS Tokens & Design System
    └── package.json
```

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

### 1. Clone & Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendance_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
NODE_ENV=development

# Geofencing Config (Office Location)
GEO_LAT=28.6139
GEO_LNG=77.2090
GEO_RADIUS_METERS=500

CLIENT_URL=http://localhost:5173
```

Seed initial Demo Data (Admin, Manager, Employee accounts):
```bash
npm run seed
```

Start Backend Server:
```bash
npm run dev
```
*(Backend runs on `http://localhost:5000`)*

---

### 2. Setup & Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 🔑 Demo Login Credentials (Seeded)

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@attendiq.com` | `admin123` | Full system access, all users, global reports |
| **Manager** | `manager@attendiq.com` | `manager123` | Team attendance, OT approval, validation |
| **Employee** | `employee@attendiq.com` | `employee123` | Punch in/out, selfie capture, OT request |

---

## 📌 Assumptions Made

1. **Selfie Storage**: Stored as base64 data URLs directly in MongoDB for simplicity without third-party cloud storage dependencies.
2. **Camera Permissions**: Assumes user grants camera permissions on browser prompt.
3. **Geofencing Coordinates**: Configured globally in `.env` (`GEO_LAT`, `GEO_LNG`). Records captured outside the radius are flagged with "Out of Zone" badges for Manager/Admin review.
4. **Shift Standard**: Hardcoded to 8 hours as per assessment guidelines.
