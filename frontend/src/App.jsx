import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './styles/App.css';
import './styles/Sidebar.css';
import './styles/colors.css';

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
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import Expenses from './pages/Expenses';
import DocumentVault from './pages/DocumentVault';

// Layout wrapper with proper structure
const Layout = ({ children }) => {
    const location = useLocation();
    const showNavbar = !['/login', '/register', '/verify-otp', '/forgot-password'].includes(location.pathname);

    return (
        <div className="app-wrapper">
            {showNavbar && <Navbar />}
            <div className="app-body">
                {showNavbar && <Sidebar />}
                <div className={showNavbar ? "app-content with-sidebar" : "app-content"}>
                    {children}
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <div className="App">
                    <Layout>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/verify-otp" element={<OTPVerification />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />

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

                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/expenses"
                                element={
                                    <ProtectedRoute>
                                        <Expenses />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/vault"
                                element={
                                    <ProtectedRoute>
                                        <DocumentVault />
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
