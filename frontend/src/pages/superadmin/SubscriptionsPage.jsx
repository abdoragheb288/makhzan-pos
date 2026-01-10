import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    CreditCard,
    Calendar,
    Building2,
    RefreshCw,
    XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { superAdminService } from '../../services/superadmin.service';

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [formData, setFormData] = useState({
        tenantId: '',
        plan: 'MONTHLY',
        amount: '',
        notes: '',
    });

    useEffect(() => {
        loadData();
    }, [statusFilter]);

    const loadData = async () => {
        try {
            const [subsResponse, tenantsResponse] = await Promise.all([
                superAdminService.getSubscriptions({ status: statusFilter || undefined }),
                superAdminService.getTenants({ limit: 100 }),
            ]);

            if (subsResponse.success) {
                setSubscriptions(subsResponse.data || []);
            }
            if (tenantsResponse.success) {
                setTenants(tenantsResponse.data || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        try {
            await superAdminService.createSubscription(formData);
            toast.success('تم إنشاء الاشتراك بنجاح');
            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleExtend = async (e) => {
        e.preventDefault();

        try {
            await superAdminService.extendSubscription(selectedSubscription.id, {
                plan: formData.plan,
                notes: formData.notes,
            });
            toast.success('تم تمديد الاشتراك بنجاح');
            setShowExtendModal(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('هل أنت متأكد من إلغاء هذا الاشتراك؟')) return;
        try {
            await superAdminService.cancelSubscription(id);
            toast.success('تم إلغاء الاشتراك');
            loadData();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const openExtendModal = (subscription) => {
        setSelectedSubscription(subscription);
        setFormData({
            ...formData,
            plan: subscription.plan,
            notes: '',
        });
        setShowExtendModal(true);
    };

    const resetForm = () => {
        setFormData({
            tenantId: '',
            plan: 'MONTHLY',
            amount: '',
            notes: '',
        });
        setSelectedSubscription(null);
    };

    const getPlanLabel = (plan) => {
        const labels = {
            MONTHLY: 'شهري',
            QUARTERLY: '3 شهور',
            SEMI_ANNUAL: '6 شهور',
            ANNUAL: 'سنوي',
        };
        return labels[plan] || plan;
    };

    const getStatusLabel = (status) => {
        const labels = {
            ACTIVE: 'نشط',
            EXPIRED: 'منتهي',
            CANCELLED: 'ملغي',
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            ACTIVE: '#22c55e',
            EXPIRED: '#ef4444',
            CANCELLED: '#6b7280',
        };
        return colors[status] || '#6b7280';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">الاشتراكات</h1>
                    <p className="page-subtitle">إدارة اشتراكات المشتركين</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                    style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}
                >
                    <Plus size={18} />
                    إضافة اشتراك
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ minWidth: 150 }}
                >
                    <option value="">كل الحالات</option>
                    <option value="ACTIVE">نشط</option>
                    <option value="EXPIRED">منتهي</option>
                    <option value="CANCELLED">ملغي</option>
                </select>
            </div>

            {/* Subscriptions Table */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>المشترك</th>
                                <th>الباقة</th>
                                <th>الحالة</th>
                                <th>تاريخ البداية</th>
                                <th>تاريخ الانتهاء</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 48 }}>
                                        <div className="loading-spinner" />
                                    </td>
                                </tr>
                            ) : subscriptions.length > 0 ? (
                                subscriptions.map((sub) => (
                                    <tr key={sub.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Building2 size={18} color="#e94560" />
                                                <span style={{ fontWeight: 500 }}>{sub.tenant?.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <CreditCard size={16} />
                                                {getPlanLabel(sub.plan)}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${getStatusColor(sub.status)}20`,
                                                    color: getStatusColor(sub.status)
                                                }}
                                            >
                                                {getStatusLabel(sub.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                                                <Calendar size={14} />
                                                {formatDate(sub.startsAt)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                                                <Calendar size={14} />
                                                {formatDate(sub.endsAt)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: 8, color: '#22c55e' }}
                                                    onClick={() => openExtendModal(sub)}
                                                    title="تمديد"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                                {sub.status === 'ACTIVE' && (
                                                    <button
                                                        className="btn btn-ghost"
                                                        style={{ padding: 8, color: '#ef4444' }}
                                                        onClick={() => handleCancel(sub.id)}
                                                        title="إلغاء"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 48 }}>
                                        لا يوجد اشتراكات
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Subscription Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h2>إضافة اشتراك جديد</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">المشترك *</label>
                                    <select
                                        value={formData.tenantId}
                                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                        required
                                    >
                                        <option value="">اختر المشترك</option>
                                        {tenants.map((tenant) => (
                                            <option key={tenant.id} value={tenant.id}>
                                                {tenant.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الباقة *</label>
                                    <select
                                        value={formData.plan}
                                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                        required
                                    >
                                        <option value="MONTHLY">شهري</option>
                                        <option value="QUARTERLY">3 شهور</option>
                                        <option value="SEMI_ANNUAL">6 شهور</option>
                                        <option value="ANNUAL">سنوي</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">المبلغ</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="اختياري"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ملاحظات</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}
                                >
                                    إنشاء الاشتراك
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Extend Subscription Modal */}
            {showExtendModal && (
                <div className="modal-overlay" onClick={() => setShowExtendModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h2>تمديد الاشتراك</h2>
                            <button className="btn btn-ghost" onClick={() => setShowExtendModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleExtend}>
                            <div className="modal-body">
                                <p style={{ marginBottom: 16 }}>
                                    تمديد اشتراك: <strong>{selectedSubscription?.tenant?.name}</strong>
                                </p>
                                <div className="form-group">
                                    <label className="form-label">مدة التمديد *</label>
                                    <select
                                        value={formData.plan}
                                        onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                        required
                                    >
                                        <option value="MONTHLY">شهر</option>
                                        <option value="QUARTERLY">3 شهور</option>
                                        <option value="SEMI_ANNUAL">6 شهور</option>
                                        <option value="ANNUAL">سنة</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ملاحظات</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowExtendModal(false)}>
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}
                                >
                                    تمديد الاشتراك
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
