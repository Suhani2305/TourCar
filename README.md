# 🚗 Smart Tour & Travel Vehicle Booking Management System

A modern web-based platform to manage vehicle bookings for tour & travel operators, featuring automatic conflict detection, multi-channel notifications, and comprehensive reporting.

## 📋 Project Status

**Current Phase:** Phase 1 - Project Foundation ✅ COMPLETE

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start the server
npm run dev
```

The backend server will start on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

## 🏗️ Project Structure

```
tour_management_car/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/                  # Mongoose models (coming in Phase 2+)
│   ├── routes/                  # API routes (coming in Phase 2+)
│   ├── middleware/              # Auth & validation middleware
│   ├── services/                # Business logic & notifications
│   ├── utils/                   # Helper functions
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── server.js                # Express server entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── styles/
│   │   │   └── index.css        # Global styles & design system
│   │   ├── utils/               # Helper functions
│   │   ├── App.js               # Main app component
│   │   └── index.js             # React entry point
│   ├── .env
│   └── package.json
│
├── SRS_Document.html            # Software Requirements Specification
└── README.md
```

## 🎯 Development Phases

- [x] **Phase 1:** Project Foundation & Setup
- [ ] **Phase 2:** Authentication System
- [ ] **Phase 3:** Dashboard
- [ ] **Phase 4:** Vehicle Management
- [ ] **Phase 5:** Booking Management
- [ ] **Phase 6:** Calendar View
- [ ] **Phase 7:** Search Functionality
- [ ] **Phase 8:** Notification System
- [ ] **Phase 9:** Reports
- [ ] **Phase 10:** Polish & Production Ready

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + bcryptjs
- **Notifications:** Nodemailer, Twilio (WhatsApp), Google Calendar API
- **Scheduling:** node-cron

### Frontend
- **Library:** React.js
- **Routing:** React Router
- **HTTP Client:** Axios
- **Date Handling:** date-fns
- **UI Components:** React Calendar, Recharts
- **Styling:** CSS3 (Custom Design System)

## 🎨 Design Theme

- **Primary:** Dark Blue (#1a2332)
- **Secondary:** Light Gray (#ecf0f1)
- **Accent:** Green (#27ae60)
- **Typography:** Inter (Google Fonts)

## ✨ Key Features

- ✅ Vehicle-wise booking management
- ✅ Time-slot conflict prevention
- ✅ Calendar-based booking view
- ✅ Instant search functionality
- ✅ 48-hour advance reminders
- ✅ Multi-channel notifications (Email, WhatsApp, Website, Calendar)
- ✅ Role-based access control
- ✅ Monthly reports & analytics

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📝 API Endpoints (Coming Soon)

- `POST /api/auth/login` - User login
- `GET /api/dashboard` - Dashboard data
- `GET /api/vehicles` - List vehicles
- `POST /api/bookings` - Create booking
- `GET /api/bookings/search` - Search bookings
- `GET /api/reports/monthly` - Monthly report

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📄 License

This project is developed for educational and commercial purposes.

## 👥 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for Tour & Travel Operators**
