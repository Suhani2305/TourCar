import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../utils/api';
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = date - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours < 0) {
            return 'Starting soon!';
        } else if (diffHours < 24) {
            return `in ${diffHours}h ${diffMins}m`;
        } else {
            const diffDays = Math.floor(diffHours / 24);
            return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
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

    return (
        <div className="main-container">
            <div className="dashboard-header">
                <h1>👋 Welcome, {user?.name}!</h1>
                <p>Here's your tour management overview</p>
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
                            <div className="stat-icon">📅</div>
                            <div className="stat-content">
                                <h3>Total Bookings</h3>
                                <p className="stat-value">{stats.totalBookings}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-revenue">
                            <div className="stat-icon">💰</div>
                            <div className="stat-content">
                                <h3>Total Revenue</h3>
                                <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-today">
                            <div className="stat-icon">📆</div>
                            <div className="stat-content">
                                <h3>Today's Bookings</h3>
                                <p className="stat-value">{stats.todayBookings}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-upcoming">
                            <div className="stat-icon">⏰</div>
                            <div className="stat-content">
                                <h3>Upcoming (48h)</h3>
                                <p className="stat-value">{stats.upcomingCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Bookings Notification Panel */}
                    {stats.upcomingBookings && stats.upcomingBookings.length > 0 && (
                        <div className="upcoming-bookings-panel">
                            <div className="panel-header">
                                <h2>🔔 Upcoming Bookings (Next 48 Hours)</h2>
                                <span className="badge">{stats.upcomingBookings.length}</span>
                            </div>
                            <div className="upcoming-bookings-list">
                                {stats.upcomingBookings.map((booking) => (
                                    <div
                                        key={booking._id}
                                        className="upcoming-booking-card"
                                        onClick={() => navigate('/bookings')}
                                    >
                                        <div className="booking-time-badge">
                                            {formatDateTime(booking.startDate)}
                                        </div>
                                        <div className="booking-details">
                                            <div className="booking-main-info">
                                                <h4>{booking.customerName}</h4>
                                                <span className="booking-number">#{booking.bookingNumber}</span>
                                            </div>
                                            <div className="booking-meta">
                                                <span className="vehicle-info">
                                                    🚗 {booking.vehicle?.registrationNumber} - {booking.vehicle?.model}
                                                </span>
                                                <span className="date-info">
                                                    📅 {formatDate(booking.startDate)} at {formatTime(booking.pickupTime)}
                                                </span>
                                                <span className="location-info">
                                                    📍 {booking.pickupLocation}
                                                </span>
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
                                <span className="btn-icon">📅</span>
                                <span className="btn-text">Manage Bookings</span>
                            </button>
                            <button
                                className="action-btn btn-vehicles"
                                onClick={() => navigate('/vehicles')}
                            >
                                <span className="btn-icon">🚗</span>
                                <span className="btn-text">Manage Vehicles</span>
                            </button>
                            {user?.role === 'superadmin' && (
                                <button
                                    className="action-btn btn-users"
                                    onClick={() => navigate('/users')}
                                >
                                    <span className="btn-icon">👥</span>
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
