import { useEffect, useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Package,
    AlertTriangle,
    DollarSign,
    Calendar,
    Award,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { dashboardService } from '../services';
import { formatCurrency, formatNumber, formatDateTime } from '../utils/helpers';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recentSales, setRecentSales] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartDays, setChartDays] = useState(7);

    useEffect(() => {
        fetchDashboardData();
    }, [chartDays]);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, salesRes, chartRes, lowStockRes, topRes] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getRecentSales(),
                dashboardService.getSalesChart(chartDays),
                dashboardService.getLowStockAlerts(),
                dashboardService.getTopProducts(30, 5),
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (salesRes.success) setRecentSales(salesRes.data);
            if (chartRes.success) setChartData(chartRes.data);
            if (lowStockRes.success) setLowStock(lowStockRes.data);
            if (topRes.success) setTopProducts(topRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    const growthPercent = stats?.todaySales?.growthPercent || 0;
    const isPositiveGrowth = growthPercent >= 0;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="page-header-info">
                    <h1>لوحة التحكم</h1>
                    <p>نظرة شاملة على أداء المتجر</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Calendar size={18} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Stats Cards - Primary Row */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {/* Today's Sales with Growth */}
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%)', color: 'white', border: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>مبيعات اليوم</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: 4 }}>
                                    {formatCurrency(stats?.todaySales?.total || 0)}
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}>
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}>
                            {isPositiveGrowth ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span style={{ fontWeight: 600 }}>{Math.abs(growthPercent)}%</span>
                            <span style={{ opacity: 0.9 }}>مقارنة بالأمس</span>
                        </div>
                    </div>
                </div>

                {/* Number of Invoices */}
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success">
                        <ShoppingCart size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatNumber(stats?.todaySales?.count || 0)}</div>
                        <div className="stat-label">فواتير اليوم</div>
                    </div>
                </div>

                {/* Average Invoice */}
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatCurrency(stats?.todaySales?.avgInvoice || 0)}</div>
                        <div className="stat-label">متوسط الفاتورة</div>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatNumber(stats?.lowStockCount || 0)}</div>
                        <div className="stat-label">تنبيه مخزون</div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="card" style={{ padding: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--color-success-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={24} color="var(--color-success-600)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(stats?.weeklySales?.total || 0)}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>مبيعات الأسبوع</div>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={24} color="var(--color-primary-600)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(stats?.monthlySales?.total || 0)}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>مبيعات الشهر</div>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={24} color="var(--color-gray-600)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatNumber(stats?.productsCount || 0)}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>إجمالي المنتجات</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3" style={{ gap: 'var(--spacing-xl)' }}>
                {/* Sales Chart */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h3 className="card-title">تحليل المبيعات</h3>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                            {[7, 14, 30].map(days => (
                                <button
                                    key={days}
                                    className={`btn btn-sm ${chartDays === days ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setChartDays(days)}
                                >
                                    {days} يوم
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return `${date.getDate()}/${date.getMonth() + 1}`;
                                    }}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 8,
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    }}
                                    formatter={(value) => [formatCurrency(value), 'المبيعات']}
                                    labelFormatter={(label) => {
                                        const date = new Date(label);
                                        return date.toLocaleDateString('ar-EG');
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#0ea5e9"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Award size={18} color="var(--color-warning-500)" />
                            الأكثر مبيعاً
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {topProducts.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                                <Package size={40} color="var(--color-gray-300)" />
                                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-muted)' }}>
                                    لا توجد بيانات
                                </p>
                            </div>
                        ) : (
                            <div>
                                {topProducts.map((item, index) => (
                                    <div
                                        key={item.product.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            padding: 'var(--spacing-md)',
                                            borderBottom: '1px solid var(--border-color)',
                                        }}
                                    >
                                        <div style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: '50%',
                                            background: index === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                                index === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                                                    index === 2 ? 'linear-gradient(135deg, #cd7f32, #a0522d)' :
                                                        'var(--color-gray-100)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: index < 3 ? 'white' : 'var(--text-secondary)',
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.product.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {formatNumber(item.totalQuantity)} قطعة
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 600, color: 'var(--color-success-600)', fontSize: '0.875rem' }}>
                                            {formatCurrency(item.totalRevenue)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-3" style={{ gap: 'var(--spacing-xl)', marginTop: 'var(--spacing-xl)' }}>
                {/* Low Stock Alerts */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={18} color="var(--color-warning-500)" />
                            تنبيهات المخزون
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {lowStock.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                                <Package size={40} color="var(--color-gray-300)" />
                                <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-muted)' }}>
                                    لا توجد تنبيهات
                                </p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                {lowStock.slice(0, 5).map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 'var(--spacing-md)',
                                            borderBottom: '1px solid var(--border-color)',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 500 }}>
                                                {item.variant?.product?.name}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                {item.variant?.size} - {item.variant?.color}
                                            </div>
                                        </div>
                                        <span className="badge badge-warning">
                                            {item.quantity} متبقي
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Sales */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h3 className="card-title">آخر المبيعات</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>رقم الفاتورة</th>
                                    <th>الفرع</th>
                                    <th>الكاشير</th>
                                    <th>الأصناف</th>
                                    <th>الإجمالي</th>
                                    <th>الوقت</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSales.slice(0, 5).map((sale) => (
                                    <tr key={sale.id}>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>
                                                {sale.invoiceNumber}
                                            </span>
                                        </td>
                                        <td>{sale.branch?.name}</td>
                                        <td>{sale.user?.name}</td>
                                        <td>{sale._count?.items}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(sale.total)}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            {formatDateTime(sale.createdAt)}
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
}
