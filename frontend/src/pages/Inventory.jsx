import { useState, useEffect } from 'react';
import { Search, AlertTriangle, Package, ArrowUpDown } from 'lucide-react';
import { inventoryService, branchService } from '../services';
import { formatNumber } from '../utils/helpers';

export default function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);

    useEffect(() => {
        fetchInventory();
        fetchBranches();
    }, [selectedBranch, showLowStock]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const response = await inventoryService.getAll({
                branchId: selectedBranch || undefined,
                lowStock: showLowStock || undefined,
                search,
            });
            if (response.success) {
                setInventory(response.data);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const lowStockCount = inventory.filter(i => i.quantity <= i.minStock).length;
    const outOfStockCount = inventory.filter(i => i.quantity === 0).length;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>المخزون</h1>
                    <p>متابعة مستويات المخزون في جميع الفروع</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatNumber(inventory.length)}</div>
                        <div className="stat-label">إجمالي الأصناف</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatNumber(lowStockCount)}</div>
                        <div className="stat-label">تحت الحد الأدنى</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-danger">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatNumber(outOfStockCount)}</div>
                        <div className="stat-label">نفذت من المخزون</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-body" style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                    <div className="search-input" style={{ flex: 1 }}>
                        <input
                            type="text"
                            placeholder="بحث عن منتج..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                        />
                        <Search className="search-icon" size={18} />
                    </div>

                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        style={{ width: 200 }}
                    >
                        <option value="">كل الفروع</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>

                    <button
                        className={`btn ${showLowStock ? 'btn-warning' : 'btn-secondary'}`}
                        onClick={() => setShowLowStock(!showLowStock)}
                    >
                        <AlertTriangle size={16} />
                        المخزون المنخفض
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <div className="loading-spinner" />
                        </div>
                    ) : inventory.length === 0 ? (
                        <div className="empty-state">
                            <Package size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد بيانات</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>المنتج</th>
                                    <th>المتغير</th>
                                    <th>الفرع</th>
                                    <th>الكمية</th>
                                    <th>الحد الأدنى</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 600 }}>{item.variant?.product?.name}</td>
                                        <td>{item.variant?.size} - {item.variant?.color || '-'}</td>
                                        <td>{item.branch?.name}</td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700,
                                                color: item.quantity === 0 ? 'var(--color-danger-500)' :
                                                    item.quantity <= item.minStock ? 'var(--color-warning-500)' :
                                                        'var(--text-primary)'
                                            }}>
                                                {formatNumber(item.quantity)}
                                            </span>
                                        </td>
                                        <td>{formatNumber(item.minStock)}</td>
                                        <td>
                                            {item.quantity === 0 ? (
                                                <span className="badge badge-danger">نفذ</span>
                                            ) : item.quantity <= item.minStock ? (
                                                <span className="badge badge-warning">منخفض</span>
                                            ) : (
                                                <span className="badge badge-success">متوفر</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
