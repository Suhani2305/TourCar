# 🚗 Tour Management & Fleet System (TourCar)

A premium, full-stack tour and car management system designed for fleet operators to manage bookings, vehicles, staff, expenses, and sensitive documents in one centralized, secure vault.

## ✨ Features

### 📅 Booking Management
- **Centralized Booking System**: Create, update, and track bookings for your entire fleet.
- **Status Tracking**: Manage lifecycle of bookings from `Pending` to `Confirmed`, `Completed`, or `Cancelled`.
- **Driver Action Bar**: Quick buttons for drivers to Call, WhatsApp, or Navigate (Google Maps) directly from the booking card.
- **Automatic Assignment**: Seamlessly link vehicles and customers to specific trip dates.

### 🚗 Vehicle Fleet Management
- **Detailed Fleet Tracking**: Manage vehicle numbers, models, types (Sedan, SUV, Bus, etc.), and seating capacities.
- **Real-time Status**: Monitor which vehicles are `Available`, `Booked`, or under `Maintenance`.
- **Global Visibility**: SuperAdmins can view the entire global fleet across all staff members.

### 👥 Staff & User Management
- **Role-Based Access (RBAC)**: Distinct permissions for `SuperAdmin` and `Staff/Drivers`.
- **Account Controls**: Approve or Pause staff accounts to control system access.
- **Protected Profiles**: Secure management of user identity and credentials.

### 💰 Expense Tracking
- **Smart Logging**: Categorize expenses like Fuel, Toll, Parking, Food, and Maintenance.
- **Visual Summaries**: View total expenditure across the operations.
- **Vehicle Linkage**: Link specific expenses to vehicles for precise profit/loss analysis.

### 🔒 Document Vault
- **Encrypted Storage**: Securely upload and store sensitive documents like Driving Licenses (DL) and Registration Certificates (RC).
- **Dual-Side Support**: Upload both front and back photos for mandatory documents.
- **Smart Expiry Alerts**: Track document validity with visual status indicators for expired papers.

### 🎨 Premium UI/UX
- **Modern Design**: Sleek, dark-themed dashboard with glassmorphism effects.
- **Premium Modals**: Fully animated, gradient-based confirmation modals for a high-end SaaS feel.
- **Responsive Layout**: Optimized for both Desktop and Mobile (Driver) views.

---

## 🛠️ Technology Stack

**Frontend:**
- React.js (Vite)
- React Router DOM
- Axios (API Integration)
- React Toastify (Notifications)
- Vanilla CSS (Premium Custom Styling)

**Backend:**
- Node.js & Express.js
- MongoDB (Mongoose ODM)
- JWT (Authentication)
- Multer (File Uploads)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v16+)
- MongoDB (Atlas or Local)

### 2. Backend Setup
```bash
cd backend
npm install
# Create .env file with:
# PORT=5000
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Update .env with:
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

### 4. Seed Admin
To create the initial SuperAdmin account:
```bash
cd backend
node seedSuperAdmin.js
```

---

## 🌐 Deployment Guide

### Frontend (Vercel)
1. Push code to GitHub.
2. Connect repository to Vercel.
3. Set **Framework Preset** to `Vite`.
4. Add **Environment Variable**: `VITE_API_URL` (pointing to your Render backend).
5. Deploy.

### Backend (Render)
1. Create a "Web Service" on Render.
2. Connect your GitHub repository.
3. Set **Start Command** to `npm start`.
4. Add **Environment Variables** (MONGODB_URI, JWT_SECRET, etc.).
5. Render will provide a URL (e.g., `https://your-app.onrender.com`). Use this in your Vercel settings.

---

## 📄 License
This project is private and for internal tour management use only.

---
*Created with ❤️ for premium fleet management.*
