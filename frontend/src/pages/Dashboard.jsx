import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../utils/api';
import { formatCurrencyShorthand } from '../utils/format';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalBookings: 0,
        totalRevenue: 0,
        todayBookings: 0,
        upcomingCount: 0,
        upcomingBookings: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await bookingAPI.getDashboardStats();
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };



    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleCall = (phone) => {
        window.open(`tel:${phone}`, '_self');
    };

    const handleWhatsApp = (phone, name, bookingNum) => {
        const message = encodeURIComponent(`Hello ${name}, I am your driver for Booking #${bookingNum}. See you soon!`);
        window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
    };

    const handleNavigate = (location) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
    };

    return (
        <div className="main-container">
            <div className="premium-header">
                <h1 className="premium-title">
                    DASHBOARD <span className="accent">OVERVIEW</span>
                </h1>
                <p className="premium-tagline">YOUR TOUR BUSINESS AT A GLANCE</p>
                <div className="premium-underline"></div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="cards-grid-4">
                        <div className="stat-card stat-bookings">
                            <div className="stat-icon-dot main"></div>
                            <div className="stat-content">
                                <h3>Total Bookings</h3>
                                <p className="stat-value">{stats.totalBookings}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-revenue">
                            <div className="stat-icon-dot revenue"></div>
                            <div className="stat-content">
                                <h3>Total Revenue</h3>
                                <p className="stat-value">{formatCurrencyShorthand(stats.totalRevenue)}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-today">
                            <div className="stat-icon-dot main"></div>
                            <div className="stat-content">
                                <h3>Today's Bookings</h3>
                                <p className="stat-value">{stats.todayBookings}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-upcoming">
                            <div className="stat-icon-dot pending"></div>
                            <div className="stat-content">
                                <h3>Upcoming (48h)</h3>
                                <p className="stat-value">{stats.upcomingCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Today's Agenda / Upcoming Bookings */}
                    {stats.upcomingBookings && stats.upcomingBookings.length > 0 && (
                        <div className="upcoming-bookings-panel agenda-section">
                            <div className="panel-header">
                                <h2>📅 Today's Agenda & Duty List</h2>
                                <span className="badge-count">{stats.upcomingBookings.length} Active Duties</span>
                            </div>
                            <div className="upcoming-bookings-list agenda-list">
                                {stats.upcomingBookings.map((booking) => (
                                    <div
                                        key={booking._id}
                                        className="upcoming-booking-card agenda-card"
                                    >
                                        <div className="booking-time-badge agenda-time">
                                            {formatDate(booking.startDate)} | {formatTime(booking.pickupTime)}
                                        </div>
                                        <div className="booking-details">
                                            <div className="booking-main-info">
                                                <h4>👤 {booking.customerName}</h4>
                                                <span className="booking-number">#{booking.bookingNumber}</span>
                                            </div>
                                            <div className="booking-meta">
                                                <span className="location-info">
                                                    📍 <strong>Pickup:</strong> {booking.pickupLocation}
                                                </span>
                                                <span className="vehicle-info">
                                                    🚗 {booking.vehicle?.registrationNumber} ({booking.vehicle?.brand} {booking.vehicle?.model})
                                                </span>
                                            </div>

                                            {/* Action Bar for Mobile/Driver Ease */}
                                            <div className="driver-action-bar">
                                                <button
                                                    className="driver-btn btn-call"
                                                    onClick={(e) => { e.stopPropagation(); handleCall(booking.customerPhone); }}
                                                >
                                                    📞 Call
                                                </button>
                                                <button
                                                    className="driver-btn btn-whatsapp"
                                                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(booking.customerPhone, booking.customerName, booking.bookingNumber); }}
                                                >
                                                    💬 WhatsApp
                                                </button>
                                                <button
                                                    className="driver-btn btn-nav"
                                                    onClick={(e) => { e.stopPropagation(); handleNavigate(booking.pickupLocation); }}
                                                >
                                                    📍 Navigate
                                                </button>
                                            </div>

                                            <div className="booking-status-badge">
                                                <span className={`status-pill status-${booking.status}`}>
                                                    {booking.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <h2>Quick Actions</h2>
                        <div className="action-buttons">
                            <button
                                className="action-btn btn-bookings"
                                onClick={() => navigate('/bookings')}
                            >
                                <span className="btn-text">Manage Bookings</span>
                            </button>
                            <button
                                className="action-btn btn-vehicles"
                                onClick={() => navigate('/vehicles')}
                            >
                                <span className="btn-text">Manage Vehicles</span>
                            </button>
                            {user?.role === 'superadmin' && (
                                <button
                                    className="action-btn btn-users"
                                    onClick={() => navigate('/admin/users')}
                                >
                                    <span className="btn-text">Manage Users</span>
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
