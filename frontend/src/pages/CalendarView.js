import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../utils/api';
import Calendar from 'react-calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import '../styles/CalendarView.css';

const CalendarView = () => {
    const { user } = useAuth();
    const [date, setDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [selectedDateBookings, setSelectedDateBookings] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'
    const [selectedUser, setSelectedUser] = useState('');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchCalendarBookings();
        if (user?.role === 'superadmin') {
            fetchUsers();
        }
    }, [date, viewMode, selectedUser]);

    const fetchUsers = async () => {
        try {
            const response = await bookingAPI.getAllUsers();
            if (response.data.success) {
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchCalendarBookings = async () => {
        try {
            setLoading(true);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);

            const params = {
                startDate: format(monthStart, 'yyyy-MM-dd'),
                endDate: format(monthEnd, 'yyyy-MM-dd')
            };

            if (user?.role === 'superadmin') {
                params.viewMode = viewMode;
                if (viewMode === 'all' && selectedUser) {
                    params.userId = selectedUser;
                }
            }

            const response = await bookingAPI.getCalendarBookings(params);
            if (response.data.success) {
                setBookings(response.data.bookings);
            }
        } catch (error) {
            console.error('Error fetching calendar bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBookingsForDate = (selectedDate) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return bookings.filter(booking => {
            const bookingDate = booking.pickupDate.split('T')[0];
            return bookingDate === dateStr;
        });
    };

    const handleDateClick = (clickedDate) => {
        const dateBookings = getBookingsForDate(clickedDate);
        setSelectedDateBookings(dateBookings);
        setShowPopup(dateBookings.length > 0);
    };

    const getTileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayBookings = getBookingsForDate(date);
            if (dayBookings.length > 0) {
                return (
                    <div className="booking-badge">
                        {dayBookings.length}
                    </div>
                );
            }
        }
        return null;
    };

    const getTileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dayBookings = getBookingsForDate(date);
            if (dayBookings.length > 0) {
                const hasConfirmed = dayBookings.some(b => b.status === 'confirmed');
                const hasPending = dayBookings.some(b => b.status === 'pending');
                const hasCancelled = dayBookings.some(b => b.status === 'cancelled');

                if (hasConfirmed) return 'has-confirmed';
                if (hasPending) return 'has-pending';
                if (hasCancelled) return 'has-cancelled';
            }
        }
        return '';
    };

    const getStatusColor = (status) => {
        const colors = {
            confirmed: '#2ecc71',
            pending: '#f39c12',
            cancelled: '#e74c3c',
            completed: '#3498db'
        };
        return colors[status] || '#95a5a6';
    };

    return (
        <div className="calendar-view-container">
            {/* Header */}
            <div className="calendar-header">
                <div className="header-left">
                    <h1>📅 Booking Calendar</h1>
                    <p className="subtitle">View and manage your bookings in calendar format</p>
                </div>

                {user?.role === 'superadmin' && (
                    <div className="view-controls">
                        <div className="view-toggle">
                            <button
                                className={viewMode === 'my' ? 'active' : ''}
                                onClick={() => {
                                    setViewMode('my');
                                    setSelectedUser('');
                                }}
                            >
                                My Bookings
                            </button>
                            <button
                                className={viewMode === 'all' ? 'active' : ''}
                                onClick={() => setViewMode('all')}
                            >
                                All Bookings
                            </button>
                        </div>

                        {viewMode === 'all' && (
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="user-filter"
                            >
                                <option value="">All Users</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <span className="legend-item">
                    <span className="color-box confirmed"></span> Confirmed
                </span>
                <span className="legend-item">
                    <span className="color-box pending"></span> Pending
                </span>
                <span className="legend-item">
                    <span className="color-box cancelled"></span> Cancelled
                </span>
                <span className="legend-item">
                    <span className="color-box completed"></span> Completed
                </span>
            </div>

            {/* Calendar */}
            <div className="calendar-wrapper">
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading bookings...</p>
                    </div>
                ) : (
                    <Calendar
                        onChange={setDate}
                        value={date}
                        onClickDay={handleDateClick}
                        tileContent={getTileContent}
                        tileClassName={getTileClassName}
                        locale="en-US"
                    />
                )}
            </div>

            {/* Booking Popup */}
            {showPopup && (
                <div className="booking-popup-overlay" onClick={() => setShowPopup(false)}>
                    <div className="booking-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-header">
                            <h3>
                                Bookings on {format(new Date(selectedDateBookings[0]?.pickupDate), 'MMMM dd, yyyy')}
                            </h3>
                            <button onClick={() => setShowPopup(false)} className="close-btn">×</button>
                        </div>
                        <div className="popup-content">
                            {selectedDateBookings.map(booking => (
                                <div key={booking._id} className="popup-booking-card">
                                    <div className="booking-header-row">
                                        <span className="booking-number">{booking.bookingNumber}</span>
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(booking.status) }}
                                        >
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="booking-details">
                                        <p><strong>Customer:</strong> {booking.customerName}</p>
                                        <p><strong>Vehicle:</strong> {booking.vehicleNumber}</p>
                                        <p><strong>Pickup Time:</strong> {booking.pickupTime}</p>
                                        <p><strong>Drop Time:</strong> {booking.dropTime}</p>
                                        <p><strong>Destination:</strong> {booking.destination}</p>
                                        <p><strong>Amount:</strong> ₹{booking.amount?.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Summary */}
            <div className="calendar-stats">
                <div className="stat-box">
                    <span className="stat-number">{bookings.length}</span>
                    <span className="stat-label">Total Bookings This Month</span>
                </div>
                <div className="stat-box">
                    <span className="stat-number">
                        {bookings.filter(b => b.status === 'confirmed').length}
                    </span>
                    <span className="stat-label">Confirmed</span>
                </div>
                <div className="stat-box">
                    <span className="stat-number">
                        {bookings.filter(b => b.status === 'pending').length}
                    </span>
                    <span className="stat-label">Pending</span>
                </div>
                <div className="stat-box">
                    <span className="stat-number">
                        ₹{bookings.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}
                    </span>
                    <span className="stat-label">Total Revenue</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
