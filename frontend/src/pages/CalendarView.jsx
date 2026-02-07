import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../utils/api';
import Calendar from 'react-calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrencyShorthand } from '../utils/format';
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

    const fetchUsers = useCallback(async () => {
        try {
            const response = await bookingAPI.getAllUsers();
            if (response.data.success) {
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }, []);

    const fetchCalendarBookings = useCallback(async () => {
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
    }, [date, viewMode, selectedUser, user?.role]);

    useEffect(() => {
        fetchCalendarBookings();
        if (user?.role === 'superadmin') {
            fetchUsers();
        }
    }, [date, viewMode, selectedUser, user?.role, fetchCalendarBookings, fetchUsers]);

    // OPTIMIZATION: Create a memoized lookup map for bookings by date
    // This avoids filtering the entire array for every single calendar tile (30+ times per render)
    const bookingsByDate = useMemo(() => {
        const map = {};
        bookings.forEach(booking => {
            const dateKey = booking.startDate.split('T')[0];
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(booking);
        });
        return map;
    }, [bookings]);

    const getBookingsForDate = useCallback((selectedDate) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return bookingsByDate[dateStr] || [];
    }, [bookingsByDate]);

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
                if (hasConfirmed) return 'has-confirmed';
                if (hasCancelled) return 'has-cancelled';
            }
        }
        return '';
    };

    const getStatusColor = (status) => {
        const colors = {
            confirmed: '#27ae60',  // Darker green
            cancelled: '#c0392b',  // Darker red
            completed: '#2980b9'   // Darker blue
        };
        return colors[status] || '#95a5a6';
    };

    return (
        <div className="main-container">
            <div className="calendar-view-container">
                {/* Premium Header */}
                <div className="premium-header">
                    <h1 className="premium-title">
                        BOOKING <span className="accent">CALENDAR</span>
                    </h1>
                    <p className="premium-tagline">VIEW AND MANAGE YOUR TOURS IN CALENDAR FORMAT</p>
                    <div className="premium-underline"></div>
                </div>



                {/* Stats Summary - Dashboard Style */}
                <div className="cards-grid-3" style={{ marginBottom: '2.5rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon-dot main"></div>
                        <div className="stat-content">
                            <h3>Month Bookings</h3>
                            <p className="stat-value">{bookings.length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#2ecc71' }}>
                        <div className="stat-icon-dot approved"></div>
                        <div className="stat-content">
                            <h3>Confirmed</h3>
                            <p className="stat-value">{bookings.filter(b => b.status === 'confirmed').length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#4A3728' }}>
                        <div className="stat-icon-dot revenue"></div>
                        <div className="stat-content">
                            <h3>Month Revenue</h3>
                            <p className="stat-value">{formatCurrencyShorthand(bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.totalAmount || 0), 0))}</p>
                        </div>
                    </div>
                </div>
                {/* Filters & Legend Row */}
                <div className="calendar-controls-row">
                    <div className="legend-pills">
                        <span className="legend-pill confirmed">Confirmed</span>
                        <span className="legend-pill cancelled">Cancelled</span>
                        <span className="legend-pill completed">Completed</span>
                    </div>

                    {user?.role === 'superadmin' && (
                        <div className="filter-dropdown-wrapper">
                            <label>DATA VIEW:</label>
                            <select
                                className="premium-select"
                                value={viewMode === 'all' && selectedUser ? selectedUser : viewMode}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'my') {
                                        setViewMode('my');
                                        setSelectedUser('');
                                    } else if (val === 'all') {
                                        setViewMode('all');
                                        setSelectedUser('');
                                    } else {
                                        setViewMode('all');
                                        setSelectedUser(val);
                                    }
                                }}
                            >
                                <option value="my">My Bookings</option>
                                <optgroup label="Global Perspective">
                                    <option value="all">Global Bookings (All Staff)</option>
                                    {users.filter(u => u._id !== user._id).map(u => (
                                        <option key={u._id} value={u._id}>
                                            &nbsp;&nbsp;&nbsp;Staff: {u.name}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    )}
                </div>

                {/* Calendar Wrapper */}
                <div className="calendar-main-wrapper" style={{ position: 'relative' }}>
                    {loading && (
                        <div className="calendar-loading-overlay">
                            <div className="spinner"></div>
                        </div>
                    )}
                    <Calendar
                        onChange={setDate}
                        value={date}
                        onClickDay={handleDateClick}
                        tileContent={getTileContent}
                        tileClassName={getTileClassName}
                        locale="en-US"
                    />
                </div>

                {/* Booking Popup */}
                {showPopup && (
                    <div className="booking-popup-overlay" onClick={() => setShowPopup(false)}>
                        <div className="booking-popup" onClick={(e) => e.stopPropagation()}>
                            <div className="popup-header">
                                <h3>
                                    Bookings on {selectedDateBookings.length > 0 && format(new Date(selectedDateBookings[0].startDate), 'MMMM dd, yyyy')}
                                </h3>
                                <button onClick={() => setShowPopup(false)} className="close-btn">×</button>
                            </div>
                            <div className="popup-content">
                                {selectedDateBookings.map(booking => (
                                    <div key={booking._id} className={`popup-booking-card status-${booking.status}`}>
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
                                            <p><strong>Vehicle:</strong> {booking.vehicle?.vehicleNumber || 'N/A'}</p>
                                            <p><strong>Pickup Time:</strong> {booking.pickupTime || 'Not specified'}</p>
                                            <p><strong>Drop Time:</strong> {booking.dropTime || 'Not specified'}</p>
                                            <p><strong>Drop Location:</strong> {booking.dropLocation || booking.pickupLocation}</p>
                                            <p><strong>Amount:</strong> {formatCurrencyShorthand(booking.totalAmount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarView;
