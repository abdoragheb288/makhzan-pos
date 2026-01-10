import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    MoreVertical,
    Eye,
    Edit,
    Pause,
    Play,
    Trash2,
    Building2,
    Users as UsersIcon,
    Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { superAdminService } from '../../services/superadmin.service';

export default function TenantsPage() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
    });

    useEffect(() => {
        loadTenants();
    }, [search, statusFilter]);

    const loadTenants = async () => {
        try {
            const response = await superAdminService.getTenants({
                search: search || undefined,
                status: statusFilter || undefined
            });
            if (response.success) {
                setTenants(response.data || []);
            }
        } catch (error) {
            console.error('Error loading tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (selectedTenant) {
                await superAdminService.updateTenant(selectedTenant.id, formData);
                toast.success('تم تحديث المشترك بنجاح');
            } else {
                await superAdminService.createTenant(formData);
                toast.success('تم إضافة المشترك بنجاح');
            }
            setShowModal(false);
            resetForm();
            loadTenants();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleSuspend = async (id) => {
        if (!confirm('هل أنت متأكد من إيقاف هذا المشترك؟')) return;
        try {
            await superAdminService.suspendTenant(id);
            toast.success('تم إيقاف المشترك');
            loadTenants();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const handleActivate = async (id) => {
        try {
            await superAdminService.activateTenant(id);
            toast.success('تم تفعيل المشترك');
            loadTenants();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المشترك؟ سيتم حذف جميع بياناته!')) return;
        try {
            await superAdminService.deleteTenant(id);
            toast.success('تم حذف المشترك');
            loadTenants();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            adminName: '',
            adminEmail: '',
            adminPassword: '',
        });
        setSelectedTenant(null);
    };

    const openEditModal = (tenant) => {
        setSelectedTenant(tenant);
        setFormData({
            name: tenant.name,
            email: tenant.email,
            phone: tenant.phone || '',
            adminName: '',
            adminEmail: '',
            adminPassword: '',
        });
        setShowModal(true);
    };

    const getStatusLabel = (status) => {
        const labels = {
            TRIAL: 'تجريبي',
            ACTIVE: 'نشط',
            SUSPENDED: 'موقوف',
            EXPIRED: 'منتهي',
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            TRIAL: '#f59e0b',
            ACTIVE: '#22c55e',
            SUSPENDED: '#ef4444',
            EXPIRED: '#6b7280',
        };
        return colors[status] || '#6b7280';
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">المشتركين</h1>
                    <p className="page-subtitle">إدارة المشتركين في النظام</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                    style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}
                >
                    <Plus size={18} />
                    إضافة مشترك
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو البريد..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ minWidth: 150 }}
                    >
                        <option value="">كل الحالات</option>
                        <option value="TRIAL">تجريبي</option>
                        <option value="ACTIVE">نشط</option>
                        <option value="SUSPENDED">موقوف</option>
                        <option value="EXPIRED">منتهي</option>
                    </select>
                </div>
            </div>

            {/* Tenants Table */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>المشترك</th>
                                <th>الحالة</th>
                                <th>المستخدمين</th>
                                <th>الفروع</th>
                                <th>تاريخ التسجيل</th>
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
                            ) : tenants.length > 0 ? (
                                tenants.map((tenant) => (
                                    <tr key={tenant.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 10,
                                                    background: 'linear-gradient(135deg, #e94560, #0f3460)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 600
                                                }}>
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 500 }}>{tenant.name}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tenant.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${getStatusColor(tenant.status)}20`,
                                                    color: getStatusColor(tenant.status)
                                                }}
                                            >
                                                {getStatusLabel(tenant.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <UsersIcon size={16} />
                                                {tenant._count?.users || 0}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Package size={16} />
                                                {tenant._count?.branches || 0}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {new Date(tenant.createdAt).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: 8 }}
                                                    onClick={() => openEditModal(tenant)}
                                                    title="تعديل"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {tenant.status === 'SUSPENDED' ? (
                                                    <button
                                                        className="btn btn-ghost"
                                                        style={{ padding: 8, color: '#22c55e' }}
                                                        onClick={() => handleActivate(tenant.id)}
                                                        title="تفعيل"
                                                    >
                                                        <Play size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-ghost"
                                                        style={{ padding: 8, color: '#f59e0b' }}
                                                        onClick={() => handleSuspend(tenant.id)}
                                                        title="إيقاف"
                                                    >
                                                        <Pause size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: 8, color: '#ef4444' }}
                                                    onClick={() => handleDelete(tenant.id)}
                                                    title="حذف"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 48 }}>
                                        لا يوجد مشتركين
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>{selectedTenant ? 'تعديل مشترك' : 'إضافة مشترك جديد'}</h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <h4 style={{ marginBottom: 12 }}>معلومات الشركة</h4>
                                <div className="form-group">
                                    <label className="form-label">اسم الشركة *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">البريد الإلكتروني *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الهاتف</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                {!selectedTenant && (
                                    <>
                                        <h4 style={{ marginBottom: 12, marginTop: 24 }}>حساب المدير</h4>
                                        <div className="form-group">
                                            <label className="form-label">اسم المدير *</label>
                                            <input
                                                type="text"
                                                value={formData.adminName}
                                                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                                required={!selectedTenant}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">بريد المدير *</label>
                                            <input
                                                type="email"
                                                value={formData.adminEmail}
                                                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                                required={!selectedTenant}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">كلمة المرور *</label>
                                            <input
                                                type="password"
                                                value={formData.adminPassword}
                                                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                                required={!selectedTenant}
                                            />
                                        </div>
                                    </>
                                )}
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
                                    {selectedTenant ? 'حفظ التغييرات' : 'إضافة المشترك'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
