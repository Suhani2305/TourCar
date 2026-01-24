import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import VehicleManagement from './pages/VehicleManagement';
import BookingManagement from './pages/BookingManagement';

// Layout wrapper to conditionally show Navbar
const Layout = ({ children }) => {
    const location = useLocation();
    const showNavbar = !['/login', '/register'].includes(location.pathname);

    return (
        <>
            {showNavbar && <Navbar />}
            {children}
        </>
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
