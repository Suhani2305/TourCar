import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, vehicleAPI, authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import '../styles/BookingManagement.css';

const BookingManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);

    // Super Admin dual view states
    const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'
    const [usersList, setUsersList] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [formData, setFormData] = useState({
        vehicle: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        startDate: '',
        endDate: '',
        pickupLocation: '',
        pickupTime: '',
        dropLocation: '',
        dropTime: '',
        purpose: '',
        totalAmount: '',
        advanceAmount: '',
        notes: ''
    });

    const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];

    useEffect(() => {
        fetchBookings();
        fetchVehicles();
        if (user?.role === 'superadmin') {
            fetchUsersList();
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [viewMode, selectedUserId]);

    const fetchBookings = async () => {
        try {
            console.log('🔍 Fetching bookings...', { viewMode, selectedUserId, userRole: user?.role });
            const params = {};

            // Super admin filtering logic
            if (user?.role === 'superadmin' && viewMode === 'all' && selectedUserId) {
                params.createdBy = selectedUserId;
            }

            console.log('📡 API call params:', params);
            const response = await bookingAPI.getAll(params);
            console.log('✅ Bookings fetched:', response.data);
            setBookings(response.data.bookings);

            if (response.data.bookings.length === 0) {
                console.warn('⚠️ No bookings found! Database might be empty or filtering is excluding all bookings.');
            }
        } catch (error) {
            console.error('❌ Error fetching bookings:', error);
            console.error('Error details:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicles = async () => {
        try {
            const response = await vehicleAPI.getAll();
            setVehicles(response.data.vehicles.filter(v => v.status !== 'inactive'));
        } catch (error) {
            console.error('Failed to fetch vehicles');
        }
    };

    const fetchUsersList = async () => {
        try {
            const response = await authAPI.getUsersList();
            setUsersList(response.data.users);
        } catch (error) {
            console.error('Failed to fetch users list:', error);
        }
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setSelectedUserId(''); // Reset user filter when changing view mode
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate dates
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            toast.error('End date cannot be before start date');
            return;
        }

        try {
            if (editingBooking) {
                await bookingAPI.update(editingBooking._id, formData);
                toast.success('Booking updated successfully!');
            } else {
                await bookingAPI.create(formData);
                toast.success('Booking created successfully!');
            }

            setShowModal(false);
            setEditingBooking(null);
            resetForm();
            fetchBookings();
            fetchVehicles(); // Refresh to update vehicle status
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (booking) => {
        setEditingBooking(booking);
        setFormData({
            vehicle: booking.vehicle._id,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail || '',
            startDate: booking.startDate.split('T')[0],
            endDate: booking.endDate.split('T')[0],
            pickupLocation: booking.pickupLocation,
            dropLocation: booking.dropLocation || '',
            purpose: booking.purpose || '',
            totalAmount: booking.totalAmount || '',
            advanceAmount: booking.advanceAmount || '',
            notes: booking.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            try {
                await bookingAPI.delete(id);
                toast.success('Booking deleted successfully!');
                fetchBookings();
                fetchVehicles();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete booking');
            }
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await bookingAPI.updateStatus(id, newStatus);
            toast.success('Status updated successfully!');
            fetchBookings();
            fetchVehicles();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const resetForm = () => {
        setFormData({
            vehicle: '',
            customerName: '',
            customerPhone: '',
            customerEmail: '',
            startDate: '',
            endDate: '',
            pickupLocation: '',
            pickupTime: '',
            dropLocation: '',
            dropTime: '',
            purpose: '',
            totalAmount: '',
            advanceAmount: '',
            notes: ''
        });
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingBooking(null);
        resetForm();
    };

    const filteredBookings = bookings.filter(b => {
        const matchesFilter = filter === 'all' || b.status === filter;
        const matchesSearch =
            b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customerPhone.includes(searchTerm) ||
            b.vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', icon: '⏳', text: 'Pending' },
            confirmed: { class: 'badge-success', icon: '✅', text: 'Confirmed' },
            completed: { class: 'badge-info', icon: '🎉', text: 'Completed' },
            cancelled: { class: 'badge-danger', icon: '❌', text: 'Cancelled' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`badge ${badge.class}`}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDuration = (start, end) => {
        const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
        const totalDays = days === 0 ? 1 : days; // Same day = 1 day
        return `${totalDays} day${totalDays > 1 ? 's' : ''}`;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader">🔄 Loading bookings...</div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="booking-management-container">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1>📅 Booking Management</h1>
                        <p>Manage vehicle bookings and reservations</p>
                    </div>
                    <div className="header-actions">
                        {user?.role === 'superadmin' && (
                            <div className="view-mode-toggle">
                                <button
                                    className={`toggle-btn ${viewMode === 'my' ? 'active' : ''}`}
                                    onClick={() => handleViewModeChange('my')}
                                >
                                    📋 My Bookings
                                </button>
                                <button
                                    className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                                    onClick={() => handleViewModeChange('all')}
                                >
                                    🌐 All Bookings
                                </button>
                            </div>
                        )}
                        <button onClick={() => setShowModal(true)} className="btn btn-primary">
                            ➕ New Booking
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card stat-total">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <h3>{bookings.length}</h3>
                            <p>Total Bookings</p>
                        </div>
                    </div>
                    <div className="stat-card stat-pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <h3>{bookings.filter(b => b.status === 'pending').length}</h3>
                            <p>Pending</p>
                        </div>
                    </div>
                    <div className="stat-card stat-confirmed">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <h3>{bookings.filter(b => b.status === 'confirmed').length}</h3>
                            <p>Confirmed</p>
                        </div>
                    </div>
                    <div className="stat-card stat-completed">
                        <div className="stat-icon">🎉</div>
                        <div className="stat-content">
                            <h3>{bookings.filter(b => b.status === 'completed').length}</h3>
                            <p>Completed</p>
                        </div>
                    </div>
                </div>


                {/* Filter Buttons */}
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({bookings.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({bookings.filter(b => b.status === 'pending').length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
                        onClick={() => setFilter('confirmed')}
                    >
                        Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Completed ({bookings.filter(b => b.status === 'completed').length})
                    </button>
                </div>

                {/* Search and User Filter */}
                <div className="controls-section">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="🔍 Search by booking number, customer, phone, or vehicle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* User Filter for Super Admin in 'All' mode */}
                    {user?.role === 'superadmin' && viewMode === 'all' && (
                        <div className="user-filter">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="user-filter-select"
                            >
                                <option value="">👥 All Users</option>
                                {usersList.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Bookings List */}
                <div className="bookings-list">
                    {filteredBookings.length === 0 ? (
                        <div className="no-data">No bookings found</div>
                    ) : (
                        filteredBookings.map((booking) => (
                            <div key={booking._id} className="booking-card">
                                <div className="booking-card-header">
                                    <div className="booking-number">
                                        <span className="label">Booking #</span>
                                        <span className="value">{booking.bookingNumber}</span>
                                    </div>
                                    {getStatusBadge(booking.status)}
                                </div>

                                <div className="booking-card-body">
                                    <div className="booking-section">
                                        <h4>🚗 Vehicle Details</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="label">Vehicle:</span>
                                                <span className="value">{booking.vehicle.vehicleNumber}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Type:</span>
                                                <span className="value">{booking.vehicle.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="booking-section">
                                        <h4>👤 Customer Details</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="label">Name:</span>
                                                <span className="value">{booking.customerName}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Phone:</span>
                                                <span className="value">{booking.customerPhone}</span>
                                            </div>
                                            {booking.customerEmail && (
                                                <div className="info-item">
                                                    <span className="label">Email:</span>
                                                    <span className="value">{booking.customerEmail}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="booking-section">
                                        <h4>📅 Booking Period</h4>
                                        <div className="date-range">
                                            <div className="date-item">
                                                <span className="date-label">From:</span>
                                                <span className="date-value">{formatDate(booking.startDate)}</span>
                                            </div>
                                            <span className="date-separator">→</span>
                                            <div className="date-item">
                                                <span className="date-label">To:</span>
                                                <span className="date-value">{formatDate(booking.endDate)}</span>
                                            </div>
                                            <div className="duration">
                                                <span className="duration-badge">{getDuration(booking.startDate, booking.endDate)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="booking-section">
                                        <h4>📍 Location Details</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="label">Pickup:</span>
                                                <span className="value">{booking.pickupLocation}</span>
                                            </div>
                                            {booking.dropLocation && (
                                                <div className="info-item">
                                                    <span className="label">Drop:</span>
                                                    <span className="value">{booking.dropLocation}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(booking.totalAmount || booking.advanceAmount) && (
                                        <div className="booking-section">
                                            <h4>💰 Payment Details</h4>
                                            <div className="info-grid">
                                                {booking.totalAmount && (
                                                    <div className="info-item">
                                                        <span className="label">Total:</span>
                                                        <span className="value amount">₹{booking.totalAmount}</span>
                                                    </div>
                                                )}
                                                {booking.advanceAmount && (
                                                    <div className="info-item">
                                                        <span className="label">Advance:</span>
                                                        <span className="value amount">₹{booking.advanceAmount}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="booking-card-actions">
                                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                        <select
                                            value={booking.status}
                                            onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                                            className="status-select"
                                        >
                                            {statusOptions.map(status => (
                                                <option key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <button
                                        className="btn-action btn-edit"
                                        onClick={() => handleEdit(booking)}
                                        title="Edit Booking"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="btn-action btn-delete"
                                        onClick={() => handleDelete(booking._id)}
                                        title="Delete Booking"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingBooking ? '✏️ Edit Booking' : '➕ New Booking'}</h2>
                                <button className="modal-close" onClick={handleCloseModal}>✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-section">
                                    <h3>🚗 Vehicle Selection</h3>
                                    <div className="form-group">
                                        <label>Vehicle *</label>
                                        <select
                                            value={formData.vehicle}
                                            onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Vehicle</option>
                                            {vehicles.map(vehicle => (
                                                <option key={vehicle._id} value={vehicle._id}>
                                                    {vehicle.vehicleNumber} - {vehicle.type} ({vehicle.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>👤 Customer Information</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Customer Name *</label>
                                            <input
                                                type="text"
                                                value={formData.customerName}
                                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                                placeholder="Enter customer name"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number *</label>
                                            <input
                                                type="tel"
                                                value={formData.customerPhone}
                                                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                                placeholder="Enter phone number"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={formData.customerEmail}
                                            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>📅 Booking Dates</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Start Date *</label>
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>End Date *</label>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>📍 Location Details</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Pickup Location *</label>
                                            <input
                                                type="text"
                                                value={formData.pickupLocation}
                                                onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                                                placeholder="Enter pickup location"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Pickup Time</label>
                                            <input
                                                type="time"
                                                value={formData.pickupTime}
                                                onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Drop Location</label>
                                            <input
                                                type="text"
                                                value={formData.dropLocation}
                                                onChange={(e) => setFormData({ ...formData, dropLocation: e.target.value })}
                                                placeholder="Enter drop location"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Drop Time</label>
                                            <input
                                                type="time"
                                                value={formData.dropTime}
                                                onChange={(e) => setFormData({ ...formData, dropTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>💰 Payment Details</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Total Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.totalAmount}
                                                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                                placeholder="Enter total amount"
                                                min="0"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Advance Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.advanceAmount}
                                                onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                                                placeholder="Enter advance amount"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>📝 Additional Information</h3>
                                    <div className="form-group">
                                        <label>Purpose</label>
                                        <input
                                            type="text"
                                            value={formData.purpose}
                                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                            placeholder="e.g., Wedding, Corporate Event, Tour"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Notes</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Additional notes or special requirements..."
                                            rows="3"
                                        />
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingBooking ? '✅ Update Booking' : '✅ Create Booking'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingManagement;
