import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../utils/api';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '../styles/Reports.css';

const Reports = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [revenueData, setRevenueData] = useState(null);
    const [bookingStats, setBookingStats] = useState(null);
    const [vehicleUtilization, setVehicleUtilization] = useState(null);
    const [viewMode, setViewMode] = useState('my');
    const [selectedUser, setSelectedUser] = useState('');
    const [users, setUsers] = useState([]);

    const COLORS = ['#2ecc71', '#f39c12', '#e74c3c', '#3498db', '#9b59b6'];

    useEffect(() => {
        fetchReports();
        if (user?.role === 'superadmin') {
            fetchUsers();
        }
    }, [dateRange, viewMode, selectedUser]);

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

    const fetchReports = async () => {
        try {
            setLoading(true);
            const params = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            };

            if (user?.role === 'superadmin') {
                params.viewMode = viewMode;
                if (viewMode === 'all' && selectedUser) {
                    params.userId = selectedUser;
                }
            }

            const [revenueRes, statsRes, vehicleRes] = await Promise.all([
                bookingAPI.getRevenueReport(params),
                bookingAPI.getBookingAnalytics(params),
                bookingAPI.getVehicleUtilization(params)
            ]);

            if (revenueRes.data.success) setRevenueData(revenueRes.data);
            if (statsRes.data.success) setBookingStats(statsRes.data);
            if (vehicleRes.data.success) setVehicleUtilization(vehicleRes.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text('Tour Management - Reports', 14, 20);

        // Date Range
        doc.setFontSize(10);
        doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 30);

        // Revenue Summary
        doc.setFontSize(14);
        doc.text('Revenue Summary', 14, 45);
        doc.autoTable({
            startY: 50,
            head: [['Metric', 'Value']],
            body: [
                ['Total Revenue', `₹${revenueData?.totalRevenue?.toLocaleString() || 0}`],
                ['Total Bookings', revenueData?.bookingCount || 0],
                ['Average Booking Value', `₹${revenueData?.averageBookingValue?.toLocaleString() || 0}`]
            ]
        });

        // Booking Stats
        let finalY = doc.lastAutoTable.finalY + 10;
        doc.text('Booking Statistics', 14, finalY);
        doc.autoTable({
            startY: finalY + 5,
            head: [['Status', 'Count']],
            body: Object.entries(bookingStats?.byStatus || {}).map(([status, count]) => [
                status.charAt(0).toUpperCase() + status.slice(1),
                count
            ])
        });

        // Vehicle Utilization
        finalY = doc.lastAutoTable.finalY + 10;
        doc.text('Top Vehicles', 14, finalY);
        doc.autoTable({
            startY: finalY + 5,
            head: [['Vehicle', 'Bookings', 'Revenue']],
            body: (vehicleUtilization?.topVehicles || []).slice(0, 5).map(v => [
                v.vehicleNumber,
                v.bookings,
                `₹${v.revenue?.toLocaleString()}`
            ])
        });

        doc.save(`tour_report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        // Revenue Sheet
        const revenueSheet = XLSX.utils.json_to_sheet([
            { Metric: 'Total Revenue', Value: `₹${revenueData?.totalRevenue || 0}` },
            { Metric: 'Total Bookings', Value: revenueData?.bookingCount || 0 },
            { Metric: 'Average Booking Value', Value: `₹${revenueData?.averageBookingValue || 0}` }
        ]);
        XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue');

        // Booking Stats Sheet
        const statsSheet = XLSX.utils.json_to_sheet(
            Object.entries(bookingStats?.byStatus || {}).map(([status, count]) => ({
                Status: status.charAt(0).toUpperCase() + status.slice(1),
                Count: count
            }))
        );
        XLSX.utils.book_append_sheet(wb, statsSheet, 'Booking Stats');

        // Vehicle Utilization Sheet
        const vehicleSheet = XLSX.utils.json_to_sheet(
            (vehicleUtilization?.topVehicles || []).map(v => ({
                'Vehicle Number': v.vehicleNumber,
                'Bookings': v.bookings,
                'Revenue': v.revenue
            }))
        );
        XLSX.utils.book_append_sheet(wb, vehicleSheet, 'Vehicles');

        XLSX.writeFile(wb, `tour_report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
    };

    if (loading) {
        return (
            <div className="reports-loading">
                <div className="spinner"></div>
                <p>Loading reports...</p>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="reports-container">
                {/* Header */}
                <div className="reports-header">
                    <div className="header-left">
                        <h1>📊 Reports & Analytics</h1>
                        <p className="subtitle">Comprehensive business insights and data visualization</p>
                    </div>

                    <div className="header-actions">
                        <button onClick={exportToPDF} className="export-btn pdf-btn">
                            📄 Export PDF
                        </button>
                        <button onClick={exportToExcel} className="export-btn excel-btn">
                            📊 Export Excel
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="reports-filters">
                    <div className="filter-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                    </div>
                    <div className="filter-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        />
                    </div>

                    {user?.role === 'superadmin' && (
                        <>
                            <div className="filter-group">
                                <label>View Mode</label>
                                <div className="view-toggle">
                                    <button
                                        className={viewMode === 'my' ? 'active' : ''}
                                        onClick={() => {
                                            setViewMode('my');
                                            setSelectedUser('');
                                        }}
                                    >
                                        My Data
                                    </button>
                                    <button
                                        className={viewMode === 'all' ? 'active' : ''}
                                        onClick={() => setViewMode('all')}
                                    >
                                        All Data
                                    </button>
                                </div>
                            </div>

                            {viewMode === 'all' && (
                                <div className="filter-group">
                                    <label>Filter by User</label>
                                    <select
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                    >
                                        <option value="">All Users</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>
                                                {u.name} ({u.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Revenue Summary Cards */}
                <div className="summary-cards">
                    <div className="summary-card revenue-card">
                        <div className="card-icon">💰</div>
                        <div className="card-content">
                            <h3>Total Revenue</h3>
                            <p className="card-value">₹{revenueData?.totalRevenue?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                    <div className="summary-card bookings-card">
                        <div className="card-icon">📋</div>
                        <div className="card-content">
                            <h3>Total Bookings</h3>
                            <p className="card-value">{revenueData?.bookingCount || 0}</p>
                        </div>
                    </div>
                    <div className="summary-card average-card">
                        <div className="card-icon">📈</div>
                        <div className="card-content">
                            <h3>Average Booking Value</h3>
                            <p className="card-value">₹{revenueData?.averageBookingValue?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                    <div className="summary-card growth-card">
                        <div className="card-icon">🚀</div>
                        <div className="card-content">
                            <h3>Growth Rate</h3>
                            <p className="card-value">{revenueData?.growthRate || 0}%</p>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="charts-grid">
                    {/* Revenue Trend Chart */}
                    <div className="chart-card">
                        <h3>Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={revenueData?.dailyRevenue || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#2ecc71" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Booking Status Distribution */}
                    <div className="chart-card">
                        <h3>Booking Status Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={Object.entries(bookingStats?.byStatus || {}).map(([name, value]) => ({
                                        name: name.charAt(0).toUpperCase() + name.slice(1),
                                        value
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {Object.keys(bookingStats?.byStatus || {}).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Vehicles Revenue */}
                    <div className="chart-card full-width">
                        <h3>Top Vehicles by Revenue</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={vehicleUtilization?.topVehicles?.slice(0, 10) || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="vehicleNumber" />
                                <YAxis />
                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#3498db" />
                                <Bar dataKey="bookings" fill="#f39c12" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vehicle Utilization Table */}
                <div className="data-table-card">
                    <h3>Vehicle Utilization Report</h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Vehicle Number</th>
                                    <th>Total Bookings</th>
                                    <th>Revenue</th>
                                    <th>Utilization %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicleUtilization?.vehicles?.map(v => (
                                    <tr key={v._id}>
                                        <td>{v.vehicleNumber}</td>
                                        <td>{v.bookings}</td>
                                        <td>₹{v.revenue?.toLocaleString()}</td>
                                        <td>
                                            <div className="utilization-bar">
                                                <div
                                                    className="utilization-fill"
                                                    style={{ width: `${v.utilizationRate || 0}%` }}
                                                ></div>
                                                <span>{v.utilizationRate?.toFixed(1) || 0}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
