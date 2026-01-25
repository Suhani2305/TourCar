import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import './styles/App.css'; // Import app-wide layout

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import OTPVerification from './pages/OTPVerification';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import VehicleManagement from './pages/VehicleManagement';
import BookingManagement from './pages/BookingManagement';
import CalendarView from './pages/CalendarView';
import Reports from './pages/Reports';

// Layout wrapper with proper structure
const Layout = ({ children }) => {
    const location = useLocation();
    const showNavbar = !['/login', '/register', '/verify-otp'].includes(location.pathname);

    return (
        <div className="app-wrapper">
            {showNavbar && <Navbar />}
            <div className={showNavbar ? "app-content" : ""}>
                {children}
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="App">
                    <Layout>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/verify-otp" element={<OTPVerification />} />

                            {/* Protected Routes */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Super Admin Only Routes */}
                            <Route
                                path="/admin/users"
                                element={
                                    <ProtectedRoute requireSuperAdmin={true}>
                                        <UserManagement />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Vehicle Management */}
                            <Route
                                path="/vehicles"
                                element={
                                    <ProtectedRoute>
                                        <VehicleManagement />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Booking Management */}
                            <Route
                                path="/bookings"
                                element={
                                    <ProtectedRoute>
                                        <BookingManagement />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Calendar View */}
                            <Route
                                path="/calendar"
                                element={
                                    <ProtectedRoute>
                                        <CalendarView />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Reports */}
                            <Route
                                path="/reports"
                                element={
                                    <ProtectedRoute>
                                        <Reports />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Default Redirect */}
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </Layout>

                    <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="light"
                    />
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
