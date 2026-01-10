import { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    Package,
    MapPin,
    Calendar,
    Download,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { reportService, branchService } from '../services';
import { formatCurrency, formatNumber } from '../utils/helpers';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
    const [activeReport, setActiveReport] = useState('sales');
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [selectedBranch, setSelectedBranch] = useState('');
    const [branches, setBranches] = useState([]);

    const [salesData, setSalesData] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);
    const [branchPerformance, setBranchPerformance] = useState([]);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [activeReport, dateRange, selectedBranch]);

    const fetchBranches = async () => {
        try {
            const response = await branchService.getAll({ limit: 100 });
            if (response.success) {
                setBranches(response.data);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                branchId: selectedBranch || undefined,
            };

            switch (activeReport) {
                case 'sales':
                    const [summaryRes, periodRes] = await Promise.all([
                        reportService.getSalesSummary(params),
                        reportService.getSalesByPeriod(params),
                    ]);
                    if (summaryRes.success) setSalesData(summaryRes.data);
                    break;
                case 'products':
                    const topRes = await reportService.getTopProducts({ ...params, limit: 10 });
                    if (topRes.success) setTopProducts(topRes.data);
                    break;
                case 'inventory':
                    const invRes = await reportService.getInventoryReport(params);
                    if (invRes.success) setInventoryData(invRes.data.summary || invRes.data);
                    break;
                case 'branches':
                    const branchRes = await reportService.getBranchPerformance(params);
                    if (branchRes.success) setBranchPerformance(branchRes.data);
                    break;
            }
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const reportTypes = [
        { id: 'sales', label: 'تقرير المبيعات', icon: TrendingUp },
        { id: 'products', label: 'أفضل المنتجات', icon: Package },
        { id: 'inventory', label: 'تقرير المخزون', icon: BarChart3 },
        { id: 'branches', label: 'أداء الفروع', icon: MapPin },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>التقارير</h1>
                    <p>تقارير وإحصائيات شاملة</p>
                </div>
                <button className="btn btn-secondary">
                    <Download size={18} />
                    تصدير
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-body" style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">من تاريخ</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            style={{ width: 180 }}
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">إلى تاريخ</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            style={{ width: 180 }}
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">الفرع</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            style={{ width: 180 }}
                        >
                            <option value="">كل الفروع</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-xl)' }}>
                {/* Report Types */}
                <div style={{ width: 220, flexShrink: 0 }}>
                    <div className="card">
                        <div className="card-body" style={{ padding: 'var(--spacing-sm)' }}>
                            {reportTypes.map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => setActiveReport(report.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-md)',
                                        width: '100%',
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--border-radius)',
                                        border: 'none',
                                        background: activeReport === report.id ? 'var(--color-primary-50)' : 'transparent',
                                        color: activeReport === report.id ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        textAlign: 'right',
                                        marginBottom: 4,
                                    }}
                                >
                                    <report.icon size={18} />
                                    {report.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div style={{ flex: 1 }}>
                    {loading ? (
                        <div className="card">
                            <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                                <div className="loading-spinner" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Sales Report */}
                            {activeReport === 'sales' && salesData && (
                                <>
                                    <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <div className="stat-card">
                                            <div className="stat-content">
                                                <div className="stat-value">{formatCurrency(salesData.totalSales || 0)}</div>
                                                <div className="stat-label">إجمالي المبيعات</div>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-content">
                                                <div className="stat-value">{formatNumber(salesData.totalInvoices || 0)}</div>
                                                <div className="stat-label">عدد الفواتير</div>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-content">
                                                <div className="stat-value">{formatCurrency(salesData.averageInvoice || 0)}</div>
                                                <div className="stat-label">متوسط الفاتورة</div>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-content">
                                                <div className="stat-value">{formatNumber(salesData.totalItems || 0)}</div>
                                                <div className="stat-label">إجمالي الأصناف المباعة</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">المبيعات اليومية</h3>
                                        </div>
                                        <div className="card-body" style={{ height: 350, minWidth: 300 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={salesData.dailySales || []}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="#94a3b8"
                                                        tickFormatter={(v) => new Date(v).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                                    />
                                                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v / 1000}k`} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                                                        formatter={(value) => [formatCurrency(value), 'المبيعات']}
                                                    />
                                                    <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Top Products Report */}
                            {activeReport === 'products' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">أفضل 10 منتجات مبيعاً</h3>
                                    </div>
                                    <div className="card-body" style={{ padding: 0 }}>
                                        {topProducts.length === 0 ? (
                                            <div className="empty-state">
                                                <Package size={60} className="empty-state-icon" />
                                                <div className="empty-state-title">لا توجد بيانات</div>
                                            </div>
                                        ) : (
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>المنتج</th>
                                                        <th>الكمية المباعة</th>
                                                        <th>الإيرادات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {topProducts.map((product, index) => (
                                                        <tr key={product.variantId}>
                                                            <td>
                                                                <span style={{
                                                                    width: 28,
                                                                    height: 28,
                                                                    borderRadius: '50%',
                                                                    background: index < 3 ? COLORS[index] : 'var(--color-gray-200)',
                                                                    color: index < 3 ? 'white' : 'var(--text-primary)',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.8125rem',
                                                                }}>
                                                                    {index + 1}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ fontWeight: 600 }}>{product.productName}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                    {product.size} - {product.color}
                                                                </div>
                                                            </td>
                                                            <td style={{ fontWeight: 600 }}>{formatNumber(product.totalQuantity)}</td>
                                                            <td style={{ fontWeight: 600, color: 'var(--color-success-600)' }}>
                                                                {formatCurrency(product.totalRevenue)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Inventory Report */}
                            {activeReport === 'inventory' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">ملخص المخزون</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                                            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', background: 'var(--color-success-50)', borderRadius: 'var(--border-radius)' }}>
                                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success-600)' }}>
                                                    {formatNumber(inventoryData.totalQuantity || inventoryData.inStock || 0)}
                                                </div>
                                                <div style={{ color: 'var(--text-muted)' }}>متوفر</div>
                                            </div>
                                            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', background: 'var(--color-warning-50)', borderRadius: 'var(--border-radius)' }}>
                                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-warning-600)' }}>
                                                    {formatNumber(inventoryData.lowStockCount || inventoryData.lowStock || 0)}
                                                </div>
                                                <div style={{ color: 'var(--text-muted)' }}>مخزون منخفض</div>
                                            </div>
                                            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', background: 'var(--color-danger-50)', borderRadius: 'var(--border-radius)' }}>
                                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-danger-600)' }}>
                                                    {formatNumber(inventoryData.outOfStockCount || inventoryData.outOfStock || 0)}
                                                </div>
                                                <div style={{ color: 'var(--text-muted)' }}>نفذ من المخزون</div>
                                            </div>
                                        </div>
                                        <div style={{ height: 300, minWidth: 300 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'متوفر', value: inventoryData.totalQuantity || inventoryData.inStock || 0 },
                                                            { name: 'منخفض', value: inventoryData.lowStockCount || inventoryData.lowStock || 0 },
                                                            { name: 'نفذ', value: inventoryData.outOfStockCount || inventoryData.outOfStock || 0 },
                                                        ]}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                    >
                                                        <Cell fill="#22c55e" />
                                                        <Cell fill="#f59e0b" />
                                                        <Cell fill="#ef4444" />
                                                    </Pie>
                                                    <Tooltip formatter={(value) => formatNumber(value)} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Branch Performance */}
                            {activeReport === 'branches' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">أداء الفروع</h3>
                                    </div>
                                    <div className="card-body" style={{ padding: 0 }}>
                                        {branchPerformance.length === 0 ? (
                                            <div className="empty-state">
                                                <MapPin size={60} className="empty-state-icon" />
                                                <div className="empty-state-title">لا توجد بيانات</div>
                                            </div>
                                        ) : (
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>الفرع</th>
                                                        <th>المبيعات</th>
                                                        <th>عدد الفواتير</th>
                                                        <th>متوسط الفاتورة</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {branchPerformance.map((branch) => (
                                                        <tr key={branch.branchId}>
                                                            <td style={{ fontWeight: 600 }}>{branch.branchName}</td>
                                                            <td style={{ fontWeight: 600, color: 'var(--color-success-600)' }}>
                                                                {formatCurrency(branch.totalSales)}
                                                            </td>
                                                            <td>{formatNumber(branch.totalInvoices)}</td>
                                                            <td>{formatCurrency(branch.averageInvoice)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
