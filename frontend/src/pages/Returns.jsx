import { useState, useEffect } from 'react';
import { Plus, RotateCcw, Search, Eye, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { returnService, saleService, branchService } from '../services';
import { formatCurrency, formatDateTime } from '../utils/helpers';

export default function Returns() {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [branches, setBranches] = useState([]);
    const [reasons, setReasons] = useState([]);
    const [searchInvoice, setSearchInvoice] = useState('');
    const [foundSale, setFoundSale] = useState(null);
    const [formData, setFormData] = useState({
        saleId: '',
        branchId: '',
        reason: '',
        notes: '',
        items: [],
    });

    useEffect(() => {
        fetchReturns();
        fetchBranches();
        fetchReasons();
    }, []);

    const fetchReturns = async () => {
        try {
            const response = await returnService.getAll({ limit: 50 });
            if (response.success) setReturns(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await branchService.getAll({ limit: 100 });
            if (response.success) setBranches(response.data);
        } catch (error) { console.error(error); }
    };

    const fetchReasons = async () => {
        try {
            const response = await returnService.getReasons();
            if (response.success) setReasons(response.data);
        } catch (error) { console.error(error); }
    };

    const searchSale = async () => {
        if (!searchInvoice.trim()) return;
        try {
            const response = await saleService.getByInvoice(searchInvoice);
            if (response.success) {
                setFoundSale(response.data);
                setFormData({
                    ...formData,
                    saleId: response.data.id,
                    branchId: response.data.branchId,
                    items: response.data.items.map(item => ({
                        variantId: item.variantId,
                        productName: item.variant?.product?.name,
                        variantInfo: `${item.variant?.size} - ${item.variant?.color}`,
                        quantity: 0,
                        maxQuantity: item.quantity,
                        unitPrice: parseFloat(item.unitPrice),
                        selected: false,
                    })),
                });
            }
        } catch (error) {
            toast.error('الفاتورة غير موجودة');
            setFoundSale(null);
        }
    };

    const toggleItem = (variantId, checked) => {
        setFormData({
            ...formData,
            items: formData.items.map(item =>
                item.variantId === variantId
                    ? { ...item, selected: checked, quantity: checked ? 1 : 0 }
                    : item
            ),
        });
    };

    const updateQuantity = (variantId, quantity) => {
        setFormData({
            ...formData,
            items: formData.items.map(item =>
                item.variantId === variantId
                    ? { ...item, quantity: Math.min(parseInt(quantity) || 0, item.maxQuantity) }
                    : item
            ),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const selectedItems = formData.items.filter(i => i.selected && i.quantity > 0);
        if (selectedItems.length === 0) {
            toast.error('يجب اختيار منتج واحد على الأقل');
            return;
        }
        if (!formData.reason) {
            toast.error('يجب اختيار سبب المرتجع');
            return;
        }

        try {
            await returnService.create({
                saleId: formData.saleId,
                branchId: formData.branchId,
                reason: formData.reason,
                notes: formData.notes,
                items: selectedItems.map(i => ({
                    variantId: i.variantId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                })),
            });
            toast.success('تم تسجيل المرتجع بنجاح');
            setShowModal(false);
            resetForm();
            fetchReturns();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({ saleId: '', branchId: '', reason: '', notes: '', items: [] });
        setFoundSale(null);
        setSearchInvoice('');
    };

    const calculateRefund = () => {
        return formData.items
            .filter(i => i.selected && i.quantity > 0)
            .reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>المرتجعات</h1>
                    <p>إدارة مرتجعات المبيعات</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowModal(true); resetForm(); }}>
                    <Plus size={18} />
                    مرتجع جديد
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><RotateCcw size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{returns.length}</div>
                        <div className="stat-label">إجمالي المرتجعات</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-danger"><Package size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{returns.reduce((sum, r) => sum + (r._count?.items || 0), 0)}</div>
                        <div className="stat-label">الأصناف المرتجعة</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><RotateCcw size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{formatCurrency(returns.reduce((sum, r) => sum + parseFloat(r.totalRefund || 0), 0))}</div>
                        <div className="stat-label">إجمالي المبالغ</div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div>
                    ) : returns.length === 0 ? (
                        <div className="empty-state">
                            <RotateCcw size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد مرتجعات</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>رقم المرتجع</th>
                                    <th>رقم الفاتورة</th>
                                    <th>الفرع</th>
                                    <th>السبب</th>
                                    <th>الأصناف</th>
                                    <th>المبلغ</th>
                                    <th>التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returns.map((ret) => (
                                    <tr key={ret.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--color-warning-600)' }}>{ret.returnNumber}</td>
                                        <td>{ret.sale?.invoiceNumber}</td>
                                        <td>{ret.branch?.name}</td>
                                        <td><span className="badge badge-warning">{ret.reason}</span></td>
                                        <td>{ret._count?.items} أصناف</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(ret.totalRefund)}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{formatDateTime(ret.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">تسجيل مرتجع جديد</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Search Invoice */}
                                <div className="form-group">
                                    <label className="form-label">بحث برقم الفاتورة</label>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="أدخل رقم الفاتورة..."
                                            value={searchInvoice}
                                            onChange={(e) => setSearchInvoice(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchSale())}
                                        />
                                        <button type="button" className="btn btn-secondary" onClick={searchSale}>
                                            <Search size={18} /> بحث
                                        </button>
                                    </div>
                                </div>

                                {foundSale && (
                                    <>
                                        <div style={{ background: 'var(--color-success-50)', padding: 'var(--spacing-md)', borderRadius: 8, marginBottom: 'var(--spacing-md)' }}>
                                            <strong>الفاتورة:</strong> {foundSale.invoiceNumber} |
                                            <strong> الإجمالي:</strong> {formatCurrency(foundSale.total)} |
                                            <strong> الفرع:</strong> {foundSale.branch?.name}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">اختر المنتجات للإرجاع</label>
                                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}>
                                                {formData.items.map((item) => (
                                                    <div key={item.variantId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
                                                        <input type="checkbox" checked={item.selected} onChange={(e) => toggleItem(item.variantId, e.target.checked)} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.variantInfo}</div>
                                                        </div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                            الحد الأقصى: {item.maxQuantity}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.maxQuantity}
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.variantId, e.target.value)}
                                                            disabled={!item.selected}
                                                            className="form-input-sm"
                                                            style={{ width: 80 }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">سبب المرتجع</label>
                                            <select className="form-input" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required>
                                                <option value="">اختر السبب</option>
                                                {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">ملاحظات</label>
                                            <textarea className="form-input" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                                        </div>

                                        <div style={{ background: 'var(--color-warning-50)', padding: 'var(--spacing-md)', borderRadius: 8, textAlign: 'center' }}>
                                            <strong>مبلغ الاسترداد:</strong>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700, marginRight: 8, color: 'var(--color-warning-600)' }}>
                                                {formatCurrency(calculateRefund())}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-warning" disabled={!foundSale}>
                                    <RotateCcw size={18} /> تسجيل المرتجع
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
