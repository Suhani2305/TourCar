import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { vehicleAPI, authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';
import '../styles/VehicleManagement.css';

const VehicleManagement = () => {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);

    // Delete Confirmation Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        vehicleId: null
    });

    // Super Admin dual view states
    const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'
    const [usersList, setUsersList] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [formData, setFormData] = useState({
        vehicleNumber: '',
        type: 'Sedan',
        brand: '',
        model: '',
        capacity: '',
        color: '',
        year: new Date().getFullYear(),
        status: 'available',
        notes: ''
    });

    const vehicleTypes = ['Sedan', 'SUV', 'Mini Bus', 'Bus', 'Luxury Car', 'Tempo Traveller', 'Other'];
    const statusOptions = ['available', 'booked', 'maintenance', 'inactive'];

    const fetchVehicles = useCallback(async () => {
        try {
            const params = {};

            // Super admin filtering logic
            if (user?.role === 'superadmin' && viewMode === 'all' && selectedUserId) {
                params.createdBy = selectedUserId;
            }

            const response = await vehicleAPI.getAll(params);
            setVehicles(response.data.vehicles);
        } catch (error) {
            toast.error('Failed to fetch vehicles');
        } finally {
            setLoading(false);
        }
    }, [user?.role, viewMode, selectedUserId]);

    const fetchUsersList = useCallback(async () => {
        try {
            const response = await authAPI.getUsersList();
            setUsersList(response.data.users);
        } catch (error) {
            console.error('Failed to fetch users list:', error);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
        if (user?.role === 'superadmin') {
            fetchUsersList();
        }
    }, [fetchVehicles, fetchUsersList, user?.role]);

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setSelectedUserId(''); // Reset user filter when changing view mode
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingVehicle) {
                await vehicleAPI.update(editingVehicle._id, formData);
                toast.success('Vehicle updated successfully!');
            } else {
                await vehicleAPI.create(formData);
                toast.success('Vehicle created successfully!');
            }

            setShowModal(false);
            setEditingVehicle(null);
            resetForm();
            fetchVehicles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            vehicleNumber: vehicle.vehicleNumber,
            type: vehicle.type,
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            capacity: vehicle.capacity || '',
            color: vehicle.color || '',
            year: vehicle.year || new Date().getFullYear(),
            status: vehicle.status,
            notes: vehicle.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        try {
            await vehicleAPI.delete(deleteModal.vehicleId);
            toast.success('Vehicle deleted successfully!');
            setDeleteModal({ isOpen: false, vehicleId: null });
            fetchVehicles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete vehicle');
        }
    };

    const resetForm = () => {
        setFormData({
            vehicleNumber: '',
            type: 'Sedan',
            brand: '',
            model: '',
            capacity: '',
            color: '',
            year: new Date().getFullYear(),
            status: 'available',
            notes: ''
        });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingVehicle(null);
        resetForm();
    };

    const filteredVehicles = vehicles.filter(v => {
        const matchesFilter = filter === 'all' || v.status === filter;
        const matchesSearch =
            v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.brand && v.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (v.model && v.model.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status) => {
        const badges = {
            available: { class: 'badge-success', icon: '✅', text: 'Available' },
            booked: { class: 'badge-warning', icon: '📅', text: 'Booked' },
            maintenance: { class: 'badge-danger', icon: '🔧', text: 'Maintenance' },
            inactive: { class: 'badge-secondary', icon: '⏸️', text: 'Inactive' }
        };
        const badge = badges[status] || badges.available;
        return (
            <span className={`badge ${badge.class}`}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader">🔄 Loading vehicles...</div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="vehicle-management-container">
                {/* Premium Header */}
                <div className="premium-header">
                    <h1 className="premium-title">
                        VEHICLE <span className="accent">FLEET</span>
                    </h1>
                    <p className="premium-tagline">MANAGE YOUR PREMIUM COLLECTION OF TOUR VEHICLES</p>
                    <div className="premium-underline"></div>
                </div>

                {/* Stats Grid - Dashboard Style */}
                <div className="cards-grid-4" style={{ marginBottom: '2.5rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon-dot main"></div>
                        <div className="stat-content">
                            <h3>Total Fleet</h3>
                            <p className="stat-value">{vehicles.length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#2D5A27' }}>
                        <div className="stat-icon-dot approved"></div>
                        <div className="stat-content">
                            <h3>Available</h3>
                            <p className="stat-value">{vehicles.filter(v => v.status === 'available').length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#D4AF37' }}>
                        <div className="stat-icon-dot in-use"></div>
                        <div className="stat-content">
                            <h3>In Use</h3>
                            <p className="stat-value">{vehicles.filter(v => v.status === 'booked').length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#8B0000' }}>
                        <div className="stat-icon-dot service"></div>
                        <div className="stat-content">
                            <h3>Service</h3>
                            <p className="stat-value">{vehicles.filter(v => v.status === 'maintenance').length}</p>
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
                                placeholder="Search by number, brand, or model..."
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
                                <option value="available">Available</option>
                                <option value="booked">Booked</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="inactive">Inactive</option>
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
                                    <option value="my">My Fleet</option>
                                    <optgroup label="Global Perspective">
                                        <option value="all">Global Fleet (All Staff)</option>
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
                            ➕ ADD NEW VEHICLE
                        </button>
                    </div>
                </div>

                {/* Vehicles Grid - Desktop & Tablet */}
                <div className="vehicles-grid">
                    {filteredVehicles.length === 0 ? (
                        <div className="no-data">No vehicles found</div>
                    ) : (
                        filteredVehicles.map((vehicle) => (
                            <div key={vehicle._id} className="vehicle-card">
                                <div className="vehicle-card-header">
                                    <h3>{vehicle.vehicleNumber}</h3>
                                    {getStatusBadge(vehicle.status)}
                                </div>

                                <div className="vehicle-card-body">
                                    <div className="vehicle-info">
                                        <span className="info-label">Type:</span>
                                        <span className="info-value">{vehicle.type}</span>
                                    </div>
                                    {vehicle.brand && (
                                        <div className="vehicle-info">
                                            <span className="info-label">Brand:</span>
                                            <span className="info-value">{vehicle.brand}</span>
                                        </div>
                                    )}
                                    {vehicle.model && (
                                        <div className="vehicle-info">
                                            <span className="info-label">Model:</span>
                                            <span className="info-value">{vehicle.model}</span>
                                        </div>
                                    )}
                                    {vehicle.capacity && (
                                        <div className="vehicle-info">
                                            <span className="info-label">Capacity:</span>
                                            <span className="info-value">{vehicle.capacity} seats</span>
                                        </div>
                                    )}
                                    {vehicle.color && (
                                        <div className="vehicle-info">
                                            <span className="info-label">Color:</span>
                                            <span className="info-value">{vehicle.color}</span>
                                        </div>
                                    )}
                                    {vehicle.year && (
                                        <div className="vehicle-info">
                                            <span className="info-label">Year:</span>
                                            <span className="info-value">{vehicle.year}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="vehicle-card-actions">
                                    <button
                                        className="btn-action btn-edit"
                                        onClick={() => handleEdit(vehicle)}
                                        title="Edit Vehicle"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="btn-action btn-delete"
                                        onClick={() => setDeleteModal({ isOpen: true, vehicleId: vehicle._id })}
                                        title="Delete Vehicle"
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
                    title="Delete Vehicle"
                    message="Are you sure you want to permanently delete this vehicle from your fleet? This action cannot be undone."
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteModal({ isOpen: false, vehicleId: null })}
                    type="danger"
                    confirmText="Delete"
                    cancelText="Cancel"
                />

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                                <button className="modal-close" onClick={handleCloseModal}>✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Vehicle Number *</label>
                                        <input
                                            type="text"
                                            value={formData.vehicleNumber}
                                            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                                            placeholder="e.g., MH12AB1234"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Type *</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            required
                                        >
                                            {vehicleTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Brand</label>
                                        <input
                                            type="text"
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            placeholder="e.g., Toyota, Honda"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Model</label>
                                        <input
                                            type="text"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            placeholder="e.g., Innova, City"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Capacity (Seats)</label>
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                            placeholder="e.g., 7"
                                            min="1"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Color</label>
                                        <input
                                            type="text"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            placeholder="e.g., White, Black"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Year</label>
                                        <input
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            min="1900"
                                            max={new Date().getFullYear() + 1}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Status *</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            required
                                        >
                                            {statusOptions.map(status => (
                                                <option key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional notes about the vehicle..."
                                        rows="3"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingVehicle ? '✅ Update Vehicle' : '✅ Add Vehicle'}
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

export default VehicleManagement;
