import { useState, useEffect } from 'react';
import { Plus, Clock, Check, X, Bell, Phone, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { preorderService, productService, branchService } from '../services';
import { formatDateTime } from '../utils/helpers';

export default function PreOrders() {
    const [preOrders, setPreOrders] = useState([]);
    const [available, setAvailable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState({
        branchId: '', variantId: '', customerName: '', customerPhone: '', quantity: 1, notes: '',
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [ordersRes, availRes, branchRes, prodRes] = await Promise.all([
                preorderService.getAll({ limit: 50 }),
                preorderService.checkAvailable(),
                branchService.getAll(),
                productService.getAll({ limit: 100 }),
            ]);
            if (ordersRes.success) setPreOrders(ordersRes.data);
            if (availRes.success) setAvailable(availRes.data);
            if (branchRes.success) setBranches(branchRes.data);
            if (prodRes.success) setProducts(prodRes.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await preorderService.create(formData);
            toast.success('تم إنشاء الحجز بنجاح');
            setShowModal(false);
            setFormData({ branchId: '', variantId: '', customerName: '', customerPhone: '', quantity: 1, notes: '' });
            fetchAll();
        } catch (error) { toast.error(error.response?.data?.message || 'خطأ'); }
    };

    const handleNotify = async (id) => {
        await preorderService.markNotified(id);
        toast.success('تم إشعار العميل');
        fetchAll();
    };

    const handleComplete = async (id) => {
        await preorderService.complete(id);
        toast.success('تم إتمام الحجز');
        fetchAll();
    };

    const handleCancel = async (id) => {
        await preorderService.cancel(id);
        toast.success('تم إلغاء الحجز');
        fetchAll();
    };

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: { bg: 'var(--color-warning-50)', color: 'var(--color-warning-600)', label: 'في الانتظار' },
            NOTIFIED: { bg: 'var(--color-primary-50)', color: 'var(--color-primary-600)', label: 'تم الإشعار' },
            COMPLETED: { bg: 'var(--color-success-50)', color: 'var(--color-success-600)', label: 'مكتمل' },
            CANCELLED: { bg: 'var(--color-gray-100)', color: 'var(--text-muted)', label: 'ملغي' },
        };
        const s = styles[status] || styles.PENDING;
        return <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>{s.label}</span>;
    };

    // Get unique variants from products
    const allVariants = products.flatMap(p => p.variants?.map(v => ({ ...v, productName: p.name })) || []);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>الحجوزات المسبقة</h1>
                    <p>إدارة طلبات المقاسات غير المتوفرة</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> حجز جديد
                </button>
            </div>

            {/* Available Alert */}
            {available.length > 0 && (
                <div style={{ background: 'var(--color-success-50)', border: '1px solid var(--color-success-500)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--color-success-600)' }}>
                        <Bell size={20} /> {available.length} حجوزات أصبحت متوفرة الآن!
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><Clock size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{preOrders.filter(o => o.status === 'PENDING').length}</div>
                        <div className="stat-label">في الانتظار</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><Package size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{available.length}</div>
                        <div className="stat-label">متوفرة الآن</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><Bell size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{preOrders.filter(o => o.status === 'NOTIFIED').length}</div>
                        <div className="stat-label">تم إشعارهم</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><Check size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{preOrders.filter(o => o.status === 'COMPLETED').length}</div>
                        <div className="stat-label">مكتمل</div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}><div className="loading-spinner" /></div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>العميل</th>
                                    <th>المنتج</th>
                                    <th>الفرع</th>
                                    <th>الكمية</th>
                                    <th>التاريخ</th>
                                    <th>الحالة</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                <Phone size={12} style={{ marginLeft: 4 }} />{order.customerPhone}
                                            </div>
                                        </td>
                                        <td>
                                            <div>{order.variant?.product?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {order.variant?.size} / {order.variant?.color}
                                            </div>
                                        </td>
                                        <td>{order.branch?.name}</td>
                                        <td>{order.quantity}</td>
                                        <td style={{ fontSize: '0.875rem' }}>{formatDateTime(order.createdAt)}</td>
                                        <td>{getStatusBadge(order.status)}</td>
                                        <td>
                                            {order.status === 'PENDING' && (
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleNotify(order.id)} title="إشعار">
                                                        <Bell size={14} />
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleCancel(order.id)} title="إلغاء">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {order.status === 'NOTIFIED' && (
                                                <button className="btn btn-success btn-sm" onClick={() => handleComplete(order.id)}>
                                                    <Check size={14} /> إتمام
                                                </button>
                                            )}
                                        </td>
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
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">حجز مسبق جديد</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">الفرع</label>
                                    <select className="form-input" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} required>
                                        <option value="">اختر الفرع</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">المنتج / المقاس</label>
                                    <select className="form-input" value={formData.variantId} onChange={(e) => setFormData({ ...formData, variantId: e.target.value })} required>
                                        <option value="">اختر المنتج</option>
                                        {allVariants.map(v => <option key={v.id} value={v.id}>{v.productName} - {v.size} / {v.color}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">اسم العميل</label>
                                        <input type="text" className="form-input" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">الهاتف</label>
                                        <input type="tel" className="form-input" value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الكمية</label>
                                    <input type="number" className="form-input" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} min="1" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary">إنشاء الحجز</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
