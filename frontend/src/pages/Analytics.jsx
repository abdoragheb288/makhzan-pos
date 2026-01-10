import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Warehouse, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { analyticsService, branchService } from '../services';
import { formatCurrency } from '../utils/helpers';

export default function Analytics() {
    const [activeTab, setActiveTab] = useState('profitability');
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');

    // Data states
    const [profitData, setProfitData] = useState([]);
    const [peakData, setPeakData] = useState({ hourly: [], peakHour: 0 });
    const [centralData, setCentralData] = useState([]);
    const [seasonData, setSeasonData] = useState([]);

    useEffect(() => {
        branchService.getAll().then(res => setBranches(res.data || []));
        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedBranch, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = selectedBranch ? { branchId: selectedBranch } : {};

            switch (activeTab) {
                case 'profitability':
                    const profit = await analyticsService.getProfitability(params);
                    if (profit.success) setProfitData(profit.data);
                    break;
                case 'peakHours':
                    const peak = await analyticsService.getPeakHours(params);
                    if (peak.success) setPeakData(peak.data);
                    break;
                case 'centralInventory':
                    const central = await analyticsService.getCentralInventory(params);
                    if (central.success) setCentralData(central.data);
                    break;
                case 'seasonAlerts':
                    const season = await analyticsService.getSeasonAlerts(params);
                    if (season.success) setSeasonData(season.data);
                    break;
            }
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const tabs = [
        { id: 'profitability', icon: TrendingUp, label: 'تحليل الربحية' },
        { id: 'peakHours', icon: Clock, label: 'ساعات الذروة' },
        { id: 'centralInventory', icon: Warehouse, label: 'المخزون المركزي' },
        { id: 'seasonAlerts', icon: AlertTriangle, label: 'تنبيهات الموسم' },
    ];

    const formatHour = (hour) => {
        if (hour === 0) return '12 AM';
        if (hour === 12) return '12 PM';
        return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>التحليلات المتقدمة</h1>
                    <p>رؤى وتحليلات تفصيلية للأداء</p>
                </div>
                <select className="form-input" style={{ width: 200 }} value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                    <option value="">كل الفروع</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-md)' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: activeTab === tab.id ? 'var(--color-primary-500)' : 'var(--bg-tertiary)',
                            color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                            fontWeight: 500, transition: 'all 0.2s',
                        }}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="loading-spinner" /></div>
            ) : (
                <>
                    {/* Profitability Tab */}
                    {activeTab === 'profitability' && (
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">تحليل ربحية المنتجات</h3></div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>المنتج</th>
                                            <th>الكمية المباعة</th>
                                            <th>إجمالي الإيرادات</th>
                                            <th>إجمالي التكلفة</th>
                                            <th>صافي الربح</th>
                                            <th>هامش الربح</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profitData.map((item, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 600 }}>{item.productName}</td>
                                                <td>{item.quantitySold}</td>
                                                <td>{formatCurrency(item.totalRevenue)}</td>
                                                <td style={{ color: 'var(--color-danger-600)' }}>{formatCurrency(item.totalCost)}</td>
                                                <td style={{ fontWeight: 700, color: item.totalProfit > 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
                                                    {formatCurrency(item.totalProfit)}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        background: parseFloat(item.profitMargin) > 20 ? 'var(--color-success-50)' : 'var(--color-warning-50)',
                                                        color: parseFloat(item.profitMargin) > 20 ? 'var(--color-success-600)' : 'var(--color-warning-600)',
                                                        padding: '4px 10px', borderRadius: 6, fontWeight: 600
                                                    }}>
                                                        {item.profitMargin}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Peak Hours Tab */}
                    {activeTab === 'peakHours' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">تحليل ساعات الذروة</h3>
                                <span style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                                    ساعة الذروة: {formatHour(peakData.peakHour)} ({peakData.peakSales} مبيعات)
                                </span>
                            </div>
                            <div className="card-body">
                                <div style={{ display: 'flex', height: 300, alignItems: 'flex-end', gap: 4, paddingTop: 20 }}>
                                    {peakData.hourly?.map((h, i) => {
                                        const maxSales = Math.max(...peakData.hourly.map(x => x.sales)) || 1;
                                        const height = (h.sales / maxSales) * 250;
                                        const isPeak = h.hour === peakData.peakHour;
                                        return (
                                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{
                                                    height, minHeight: 4, width: '100%', maxWidth: 30,
                                                    background: isPeak ? 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))' : 'var(--color-gray-300)',
                                                    borderRadius: '4px 4px 0 0', transition: 'all 0.2s'
                                                }} title={`${h.sales} مبيعات - ${formatCurrency(h.revenue)}`} />
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>{h.hour}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Central Inventory Tab */}
                    {activeTab === 'centralInventory' && (
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">المخزون المركزي (جميع الفروع)</h3></div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>المنتج</th>
                                            <th>التصنيف</th>
                                            <th>إجمالي المخزون</th>
                                            <th>توزيع الفروع</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {centralData.map((product, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 600 }}>{product.productName}</td>
                                                <td>{product.category || '-'}</td>
                                                <td style={{ fontWeight: 700, color: product.totalStock < 10 ? 'var(--color-danger-600)' : 'inherit' }}>
                                                    {product.totalStock}
                                                </td>
                                                <td>
                                                    {product.variants?.slice(0, 3).map((v, vi) => (
                                                        <div key={vi} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {v.size}/{v.color}: {Object.entries(v.branchStock || {}).map(([branch, qty]) => `${branch}(${qty})`).join(', ')}
                                                        </div>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Season Alerts Tab */}
                    {activeTab === 'seasonAlerts' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">تنبيهات المنتجات الراكدة</h3>
                                <span style={{ background: 'var(--color-warning-50)', color: 'var(--color-warning-600)', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                                    {seasonData.length} منتج راكد
                                </span>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                {seasonData.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>لا توجد منتجات راكدة 🎉</div>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>المنتج</th>
                                                <th>التصنيف</th>
                                                <th>المقاس/اللون</th>
                                                <th>المخزون</th>
                                                <th>آخر بيع</th>
                                                <th>الأيام الراكدة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {seasonData.map((item, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{item.productName}</td>
                                                    <td>{item.category || '-'}</td>
                                                    <td>{item.size} / {item.color}</td>
                                                    <td>{item.totalStock}</td>
                                                    <td style={{ fontSize: '0.875rem' }}>{item.lastSaleDate ? new Date(item.lastSaleDate).toLocaleDateString('ar-EG') : 'لم يباع'}</td>
                                                    <td>
                                                        <span style={{
                                                            background: item.daysSinceLastSale > 180 ? 'var(--color-danger-50)' : 'var(--color-warning-50)',
                                                            color: item.daysSinceLastSale > 180 ? 'var(--color-danger-600)' : 'var(--color-warning-600)',
                                                            padding: '4px 10px', borderRadius: 6, fontWeight: 600
                                                        }}>
                                                            {item.daysSinceLastSale || '∞'} يوم
                                                        </span>
                                                    </td>
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
    );
}
