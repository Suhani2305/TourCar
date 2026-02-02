import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, vehicleAPI, authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';
import '../styles/BookingManagement.css';

const BookingManagement = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);

    // Delete Confirmation Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        bookingId: null
    });

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

    const fetchBookings = useCallback(async () => {
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
    }, [viewMode, selectedUserId, user?.role]);

    const fetchVehicles = useCallback(async () => {
        try {
            const response = await vehicleAPI.getAll();
            setVehicles(response.data.vehicles.filter(v => v.status !== 'inactive'));
        } catch (error) {
            console.error('Failed to fetch vehicles');
        }
    }, []);

    const fetchUsersList = useCallback(async () => {
        try {
            const response = await authAPI.getUsersList();
            setUsersList(response.data.users);
        } catch (error) {
            console.error('Failed to fetch users list:', error);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
        fetchVehicles();
        if (user?.role === 'superadmin') {
            fetchUsersList();
        }
    }, [fetchBookings, fetchVehicles, fetchUsersList, user?.role]);

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

    const handleDelete = async () => {
        try {
            await bookingAPI.delete(deleteModal.bookingId);
            toast.success('Booking deleted successfully!');
            setDeleteModal({ isOpen: false, bookingId: null });
            fetchBookings();
            fetchVehicles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete booking');
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
            pending: { class: 'badge-warning', text: 'Pending' },
            confirmed: { class: 'badge-success', text: 'Confirmed' },
            completed: { class: 'badge-info', text: 'Completed' },
            cancelled: { class: 'badge-danger', text: 'Cancelled' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`badge ${badge.class}`}>
                {badge.text}
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
                {/* Premium Header */}
                <div className="premium-header">
                    <h1 className="premium-title">
                        BOOKING <span className="accent">MANAGEMENT</span>
                    </h1>
                    <p className="premium-tagline">MANAGE VEHICLE BOOKINGS AND RESERVATIONS</p>
                    <div className="premium-underline"></div>
                </div>

                {/* Stats Grid - Dashboard Style */}
                <div className="cards-grid-4" style={{ marginBottom: '2.5rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon-dot main"></div>
                        <div className="stat-content">
                            <h3>Total Bookings</h3>
                            <p className="stat-value">{bookings.length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#D4AF37' }}>
                        <div className="stat-icon-dot pending"></div>
                        <div className="stat-content">
                            <h3>Pending</h3>
                            <p className="stat-value">{bookings.filter(b => b.status === 'pending').length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#2D5A27' }}>
                        <div className="stat-icon-dot approved"></div>
                        <div className="stat-content">
                            <h3>Confirmed</h3>
                            <p className="stat-value">{bookings.filter(b => b.status === 'confirmed').length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#1E40AF' }}>
                        <div className="stat-icon-dot completed"></div>
                        <div className="stat-content">
                            <h3>Completed</h3>
                            <p className="stat-value">{bookings.filter(b => b.status === 'completed').length}</p>
                        </div>
                    </div>
                </div>

                {/* Unified Controls Strip */}
                <div className="controls-strip">
                    <div className="controls-left">
                        <div className="search-box-premium">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by number, customer, vehicle..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-dropdown-wrapper">
                            <label>FILTER:</label>
                            <select
                                className="premium-select"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {user?.role === 'superadmin' && (
                            <div className="filter-dropdown-wrapper">
                                <label>DATA VIEW:</label>
                                <select
                                    className="premium-select"
                                    value={viewMode === 'all' && selectedUserId ? selectedUserId : viewMode}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'my') {
                                            handleViewModeChange('my');
                                        } else if (val === 'all') {
                                            handleViewModeChange('all');
                                            setSelectedUserId('');
                                        } else {
                                            handleViewModeChange('all');
                                            setSelectedUserId(val);
                                        }
                                    }}
                                >
                                    <option value="my">My Bookings</option>
                                    <optgroup label="Global Perspective">
                                        <option value="all">All Bookings (Global)</option>
                                        {usersList.filter(u => u._id !== user._id).map(u => (
                                            <option key={u._id} value={u._id}>
                                                &nbsp;&nbsp;&nbsp;Staff: {u.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="controls-right">
                        <button onClick={() => setShowModal(true)} className="btn-premium-add">
                            NEW BOOKING
                        </button>
                    </div>
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
                                        <h4>Vehicle Details</h4>
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
                                        <h4>Customer Details</h4>
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
                                        <h4>Booking Period</h4>
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
                                        <h4>Location Details</h4>
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
                                            <h4>Payment Details</h4>
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
                                    {/* Action Bar for Drivers */}
                                    <div className="driver-action-bar" style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
                                        <button
                                            className="driver-btn btn-call"
                                            onClick={() => handleCall(booking.customerPhone)}
                                        >
                                            📞 Call
                                        </button>
                                        <button
                                            className="driver-btn btn-whatsapp"
                                            onClick={() => handleWhatsApp(booking.customerPhone, booking.customerName, booking.bookingNumber)}
                                        >
                                            💬 WhatsApp
                                        </button>
                                        <button
                                            className="driver-btn btn-nav"
                                            onClick={() => handleNavigate(booking.pickupLocation)}
                                        >
                                            📍 Navigate
                                        </button>
                                    </div>
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
                                        onClick={() => setDeleteModal({ isOpen: true, bookingId: booking._id })}
                                        title="Delete Booking"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Premium Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={deleteModal.isOpen}
                    title="Delete Booking"
                    message="Are you sure you want to permanently remove this booking record? This action cannot be undone and will free up the vehicle."
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteModal({ isOpen: false, bookingId: null })}
                    type="danger"
                    confirmText="Delete"
                    cancelText="Cancel"
                />

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingBooking ? 'Edit Booking' : 'New Booking'}</h2>
                                <button className="modal-close" onClick={handleCloseModal}>✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-section">
                                    <h3>Vehicle Selection</h3>
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
                                    <h3>Customer Information</h3>
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
                                    <h3>Booking Dates</h3>
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
                                    <h3>Location Details</h3>
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
                                    <h3>Payment Details</h3>
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
                                        {editingBooking ? 'Update Booking' : 'Create Booking'}
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
