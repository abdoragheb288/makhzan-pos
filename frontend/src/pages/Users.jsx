import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users as UsersIcon, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService, branchService } from '../services';
import { getRoleLabel } from '../utils/helpers';

const AVAILABLE_PERMISSIONS = [
    { id: 'pos', label: 'نقاط البيع' },
    { id: 'products', label: 'المنتجات' },
    { id: 'inventory', label: 'المخزون' },
    { id: 'transfers', label: 'التحويلات' },
    { id: 'users', label: 'المستخدمين' },
    { id: 'settings', label: 'الإعدادات' },
    { id: 'reports', label: 'التقارير' },
];

export default function Users() {
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'CASHIER',
        branchId: '',
        permissions: [],
    });

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await userService.getAll({ limit: 100 });
            if (response.success) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData };
            if (!data.branchId) delete data.branchId;
            if (editingUser && !data.password) delete data.password;

            if (editingUser) {
                await userService.update(editingUser.id, data);
                toast.success('تم تحديث المستخدم');
            } else {
                await userService.create(data);
                toast.success('تم إضافة المستخدم');
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', phone: '', role: 'CASHIER', branchId: '', permissions: [] });
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            phone: user.phone || '',
            role: user.role,
            branchId: user.branchId || '',
            permissions: user.permissions || [],
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            await userService.delete(id);
            toast.success('تم حذف المستخدم');
            fetchUsers();
        } catch (error) {
            toast.error('حدث خطأ أثناء الحذف');
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'ADMIN': return 'badge-danger';
            case 'MANAGER': return 'badge-warning';
            default: return 'badge-primary';
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>المستخدمين</h1>
                    <p>إدارة مستخدمي النظام والصلاحيات</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={18} />
                    إضافة مستخدم
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-danger">
                        <Shield size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{users.filter(u => u.role === 'ADMIN').length}</div>
                        <div className="stat-label">مدراء</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning">
                        <Shield size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{users.filter(u => u.role === 'MANAGER').length}</div>
                        <div className="stat-label">مشرفين</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">
                        <UsersIcon size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{users.filter(u => u.role === 'CASHIER').length}</div>
                        <div className="stat-label">كاشير</div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <div className="loading-spinner" />
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>المستخدم</th>
                                    <th>البريد الإلكتروني</th>
                                    <th>الهاتف</th>
                                    <th>الدور</th>
                                    <th>الفرع</th>
                                    <th>الحالة</th>
                                    <th style={{ width: 100 }}>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                <div className="avatar">{user.name.charAt(0)}</div>
                                                <span style={{ fontWeight: 600 }}>{user.name}</span>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>{user.phone || '-'}</td>
                                        <td>
                                            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td>{user.branch?.name || 'غير محدد'}</td>
                                        <td>
                                            <span className={`badge ${user.isActive ? 'badge-success' : 'badge-gray'}`}>
                                                {user.isActive ? 'نشط' : 'معطل'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(user)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(user.id)} style={{ color: 'var(--color-danger-500)' }}>
                                                    <Trash2 size={16} />
                                                </button>
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
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">الاسم</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">كلمة المرور {editingUser && '(اتركها فارغة للإبقاء على الحالية)'}</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الهاتف</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الدور</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="CASHIER">كاشير</option>
                                        <option value="MANAGER">مشرف</option>
                                        <option value="ADMIN">مدير</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الفرع</label>
                                    <select
                                        value={formData.branchId}
                                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                    >
                                        <option value="">غير محدد</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">الصلاحيات المخصصة</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)' }}>
                                        {AVAILABLE_PERMISSIONS.map((perm) => (
                                            <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(perm.id)}
                                                    onChange={(e) => {
                                                        const newPermissions = e.target.checked
                                                            ? [...formData.permissions, perm.id]
                                                            : formData.permissions.filter(p => p !== perm.id);
                                                        setFormData({ ...formData, permissions: newPermissions });
                                                    }}
                                                />
                                                {perm.label}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="form-hint">حدد الصفحات التي يمكن للمستخدم الوصول إليها.</div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary">{editingUser ? 'تحديث' : 'إضافة'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
