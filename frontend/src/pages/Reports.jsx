import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../utils/api';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrencyShorthand } from '../utils/format';
import '../styles/Reports.css';

const Reports = () => {
    const { user } = useAuth();

    // Custom formatter for numbers (no special symbols to avoid PDF glitches)
    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

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
    // Removed showExportDropdown state as buttons are now separate

    const COLORS = ['#2ecc71', '#f39c12', '#e74c3c', '#3498db', '#9b59b6'];

    // OPTIMIZATIONS: Memoize data transformations for charts
    const chartData = useMemo(() => ({
        revenueTrend: revenueData?.dailyRevenue || [],
        statusDistribution: Object.entries(bookingStats?.byStatus || {})
            .map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value
            }))
            .filter(item => item.value > 0),
        vehicleUtilizationData: vehicleUtilization?.topVehicles?.slice(0, 10) || []
    }), [revenueData, bookingStats, vehicleUtilization]);

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

    const fetchReports = useCallback(async () => {
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
    }, [dateRange, viewMode, selectedUser, user?.role]);

    useEffect(() => {
        fetchReports();
        if (user?.role === 'superadmin') {
            fetchUsers();
        }
    }, [fetchReports, fetchUsers, user?.role]);

    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns

        // Title
        doc.setFontSize(22);
        doc.setTextColor(74, 55, 40); // #4A3728
        doc.text('TOURCAR - BUSINESS REPORT', 14, 20);

        // Date Range
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 28);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);

        // Summary KPI Table
        autoTable(doc, {
            startY: 40,
            head: [['Total Revenue', 'Total Bookings', 'Avg Booking Value', 'Growth Rate']],
            body: [[
                `INR ${formatNumber(revenueData?.totalRevenue)}`,
                revenueData?.bookingCount || 0,
                `INR ${formatNumber(revenueData?.averageBookingValue)}`,
                `${revenueData?.growthRate || 0}%`
            ]],
            headStyles: { fillColor: [74, 55, 40], halign: 'center' },
            bodyStyles: { halign: 'center', fontSize: 11 },
            columnStyles: {
                0: { halign: 'left' },
                3: { fontStyle: 'bold', textColor: revenueData?.growthRate >= 0 ? [39, 174, 96] : [231, 76, 60] }
            }
        });

        // Detailed Bookings Table
        doc.setFontSize(14);
        doc.setTextColor(74, 55, 40);
        doc.text('Detailed Booking Log', 14, doc.lastAutoTable.finalY + 15);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Date', 'Booking #', 'Customer', 'Vehicle', 'Pickup', 'Drop', 'Status', 'Revenue']],
            body: (revenueData?.bookings || []).map(b => [
                new Date(b.startDate).toLocaleDateString(),
                b.bookingNumber,
                b.customerName,
                b.vehicle?.vehicleNumber || 'N/A',
                b.pickupLocation,
                b.dropLocation,
                b.status.toUpperCase(),
                `INR ${formatNumber(b.totalAmount)}`
            ]),
            headStyles: { fillColor: [74, 55, 40] },
            alternateRowStyles: { fillColor: [250, 243, 224] },
            columnStyles: {
                7: { halign: 'right' }
            }
        });

        doc.save(`tour_report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        // Summary Data
        const summaryData = [
            { 'Report Title': 'TOURCAR BUSINESS REPORT' },
            { 'Period': `${dateRange.startDate} to ${dateRange.endDate}` },
            {},
            { Metric: 'Total Revenue', Value: revenueData?.totalRevenue || 0 },
            { Metric: 'Total Bookings', Value: revenueData?.bookingCount || 0 },
            { Metric: 'Average Booking Value', Value: revenueData?.averageBookingValue || 0 },
            { Metric: 'Growth Rate', Value: `${revenueData?.growthRate || 0}%` }
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

        // Detailed Bookings Sheet
        const detailedBookings = (revenueData?.bookings || []).map(b => ({
            'Date': new Date(b.startDate).toLocaleDateString(),
            'Booking Number': b.bookingNumber,
            'Customer Name': b.customerName,
            'Vehicle Number': b.vehicle?.vehicleNumber || 'N/A',
            'Vehicle Details': `${b.vehicle?.brand || ''} ${b.vehicle?.model || ''}`,
            'Pickup Location': b.pickupLocation,
            'Drop Location': b.dropLocation,
            'Status': b.status.toUpperCase(),
            'Revenue (INR)': b.totalAmount || 0,
            'Advance Amount': b.advanceAmount || 0
        }));
        const bookingSheet = XLSX.utils.json_to_sheet(detailedBookings);
        XLSX.utils.book_append_sheet(wb, bookingSheet, 'All Bookings');

        // Vehicle Utilization Sheet
        const vehicleSheet = XLSX.utils.json_to_sheet(
            (vehicleUtilization?.vehicles || []).map(v => ({
                'Vehicle Number': v.vehicleNumber,
                'Total Bookings': v.bookings,
                'Total Revenue': v.revenue,
                'Utilization %': v.utilizationRate?.toFixed(2)
            }))
        );
        XLSX.utils.book_append_sheet(wb, vehicleSheet, 'Vehicle Performance');

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
                {/* Premium Header */}
                <div className="premium-header">
                    <h1 className="premium-title">
                        BUSINESS <span className="accent">ANALYTICS</span>
                    </h1>
                    <p className="premium-tagline">COMPREHENSIVE PERFORMANCE INSIGHTS AND DATA VISUALIZATION</p>
                    <div className="premium-underline"></div>
                </div>

                {/* KPI Cards Grid */}
                <div className="cards-grid-4" style={{ marginBottom: '2.5rem' }}>
                    <div className="stat-card" style={{ borderLeftColor: '#4A3728' }}>
                        <div className="stat-icon-dot revenue"></div>
                        <div className="stat-content">
                            <h3>Total Revenue</h3>
                            <p className="stat-value">{formatCurrencyShorthand(revenueData?.totalRevenue)}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#D4AF37' }}>
                        <div className="stat-icon-dot main"></div>
                        <div className="stat-content">
                            <h3>Total Bookings</h3>
                            <p className="stat-value">{revenueData?.bookingCount || 0}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#2D5A27' }}>
                        <div className="stat-icon-dot growth"></div>
                        <div className="stat-content">
                            <h3>Avg Booking</h3>
                            <p className="stat-value">{formatCurrencyShorthand(revenueData?.averageBookingValue)}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#1E40AF' }}>
                        <div className="stat-icon-dot rocket"></div>
                        <div className="stat-content">
                            <h3>Growth</h3>
                            <p className="stat-value">{revenueData?.growthRate || 0}%</p>
                        </div>
                    </div>
                </div>

                {/* Unified Controls Strip */}
                <div className="controls-strip reports-filters-row">
                    <div className="controls-left">
                        <div className="filter-dropdown-wrapper">
                            <label>START DATE</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="premium-date-input"
                            />
                        </div>
                        <div className="filter-dropdown-wrapper">
                            <label>END DATE</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="premium-date-input"
                            />
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
                                    <option value="my">My Data</option>
                                    <optgroup label="Global Perspective">
                                        <option value="all">Global Data (All Staff)</option>
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

                    <div className="controls-right export-buttons-group">
                        <button onClick={exportToPDF} className="btn-premium-export btn-pdf">
                            📄 PDF
                        </button>
                        <button onClick={exportToExcel} className="btn-premium-export btn-excel">
                            📊 Excel
                        </button>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="charts-grid">
                    {/* Revenue Trend Chart */}
                    <div className="chart-card">
                        <h3>Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData.revenueTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) => {
                                        if (typeof value === 'number') return formatCurrencyShorthand(value);
                                        return String(value || '');
                                    }}
                                />
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
                                    data={chartData.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.statusDistribution.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Vehicles Revenue */}
                    <div className="chart-card full-width">
                        <h3>Top Vehicles by Revenue</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.vehicleUtilizationData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="vehicleNumber" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) => {
                                        if (typeof value === 'number') return formatCurrencyShorthand(value);
                                        return String(value || '');
                                    }}
                                />
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
                                        <td>{formatCurrencyShorthand(v.revenue)}</td>
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
