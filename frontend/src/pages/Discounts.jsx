import { useState, useEffect } from 'react';
import { Plus, Percent, Tag, Trash2, Edit2, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { discountService } from '../services';
import { formatCurrency, formatDateTime } from '../utils/helpers';

export default function Discounts() {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'PERCENTAGE',
        value: '',
        minPurchase: '',
        maxUses: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const fetchDiscounts = async () => {
        try {
            const response = await discountService.getAll({ limit: 50 });
            if (response.success) setDiscounts(response.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await discountService.update(editingId, formData);
                toast.success('تم تحديث الخصم');
            } else {
                await discountService.create(formData);
                toast.success('تم إنشاء الخصم');
            }
            setShowModal(false);
            resetForm();
            fetchDiscounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleEdit = (discount) => {
        setEditingId(discount.id);
        setFormData({
            name: discount.name,
            code: discount.code || '',
            type: discount.type,
            value: discount.value,
            minPurchase: discount.minPurchase || '',
            maxUses: discount.maxUses || '',
            startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '',
            endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا الخصم؟')) return;
        try {
            await discountService.delete(id);
            toast.success('تم حذف الخصم');
            fetchDiscounts();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const toggleActive = async (discount) => {
        try {
            await discountService.update(discount.id, { ...discount, isActive: !discount.isActive });
            toast.success(discount.isActive ? 'تم تعطيل الخصم' : 'تم تفعيل الخصم');
            fetchDiscounts();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', code: '', type: 'PERCENTAGE', value: '', minPurchase: '', maxUses: '', startDate: '', endDate: '' });
        setEditingId(null);
    };

    const isExpired = (endDate) => endDate && new Date(endDate) < new Date();

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>الخصومات والعروض</h1>
                    <p>إدارة كوبونات وخصومات المبيعات</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowModal(true); resetForm(); }}>
                    <Plus size={18} />
                    إضافة خصم
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><Tag size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{discounts.filter(d => d.isActive).length}</div>
                        <div className="stat-label">خصومات نشطة</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><Percent size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{discounts.filter(d => d.code).length}</div>
                        <div className="stat-label">كوبونات</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><Calendar size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{discounts.filter(d => isExpired(d.endDate)).length}</div>
                        <div className="stat-label">منتهية الصلاحية</div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div>
                    ) : discounts.length === 0 ? (
                        <div className="empty-state">
                            <Tag size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد خصومات</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>الاسم</th>
                                    <th>الكود</th>
                                    <th>النوع</th>
                                    <th>القيمة</th>
                                    <th>الاستخدام</th>
                                    <th>الصلاحية</th>
                                    <th>الحالة</th>
                                    <th width={120}>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discounts.map((discount) => (
                                    <tr key={discount.id} style={{ opacity: discount.isActive ? 1 : 0.6 }}>
                                        <td style={{ fontWeight: 600 }}>{discount.name}</td>
                                        <td>
                                            {discount.code ? (
                                                <code style={{ background: 'var(--color-primary-50)', padding: '4px 8px', borderRadius: 4, color: 'var(--color-primary-600)' }}>
                                                    {discount.code}
                                                </code>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${discount.type === 'PERCENTAGE' ? 'primary' : 'success'}`}>
                                                {discount.type === 'PERCENTAGE' ? 'نسبة %' : 'مبلغ ثابت'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>
                                            {discount.type === 'PERCENTAGE' ? `${discount.value}%` : formatCurrency(discount.value)}
                                        </td>
                                        <td>
                                            {discount.maxUses ? `${discount.usedCount}/${discount.maxUses}` : discount.usedCount}
                                        </td>
                                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            {discount.endDate ? (
                                                isExpired(discount.endDate) ? (
                                                    <span style={{ color: 'var(--color-danger-600)' }}>منتهي</span>
                                                ) : (
                                                    `حتى ${new Date(discount.endDate).toLocaleDateString('ar-EG')}`
                                                )
                                            ) : 'غير محدود'}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => toggleActive(discount)}
                                                style={{ color: discount.isActive ? 'var(--color-success-600)' : 'var(--color-gray-400)' }}
                                            >
                                                {discount.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(discount)}><Edit2 size={16} /></button>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger-500)' }} onClick={() => handleDelete(discount.id)}><Trash2 size={16} /></button>
                                            </div>
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
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingId ? 'تعديل الخصم' : 'إضافة خصم جديد'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">اسم الخصم</label>
                                        <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="مثال: خصم الصيف" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">كود الكوبون (اختياري)</label>
                                        <input type="text" className="form-input" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="مثال: SUMMER50" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">نوع الخصم</label>
                                        <select className="form-input" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
                                            <option value="PERCENTAGE">نسبة مئوية (%)</option>
                                            <option value="AMOUNT">مبلغ ثابت</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">القيمة</label>
                                        <input type="number" className="form-input" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} required min="0" step="0.01" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">الحد الأدنى للشراء (اختياري)</label>
                                        <input type="number" className="form-input" value={formData.minPurchase} onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })} min="0" step="0.01" placeholder="0.00" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">الحد الأقصى للاستخدام (اختياري)</label>
                                        <input type="number" className="form-input" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })} min="1" placeholder="غير محدود" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">تاريخ البداية (اختياري)</label>
                                        <input type="date" className="form-input" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">تاريخ الانتهاء (اختياري)</label>
                                        <input type="date" className="form-input" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary">{editingId ? 'تحديث' : 'إنشاء الخصم'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
