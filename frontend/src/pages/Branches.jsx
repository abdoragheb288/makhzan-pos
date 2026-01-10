import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Warehouse, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { branchService } from '../services';

export default function Branches() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [formData, setFormData] = useState({ name: '', address: '', phone: '', isWarehouse: false });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await branchService.getAll({ limit: 100 });
            if (response.success) {
                setBranches(response.data);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await branchService.update(editingBranch.id, formData);
                toast.success('تم تحديث الفرع');
            } else {
                await branchService.create(formData);
                toast.success('تم إضافة الفرع');
            }
            setShowModal(false);
            setEditingBranch(null);
            setFormData({ name: '', address: '', phone: '', isWarehouse: false });
            fetchBranches();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            address: branch.address || '',
            phone: branch.phone || '',
            isWarehouse: branch.isWarehouse,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;
        try {
            await branchService.delete(id);
            toast.success('تم حذف الفرع');
            fetchBranches();
        } catch (error) {
            toast.error('حدث خطأ أثناء الحذف');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>الفروع والمخازن</h1>
                    <p>إدارة فروع المتجر والمخازن الرئيسية</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingBranch(null); setFormData({ name: '', address: '', phone: '', isWarehouse: false }); setShowModal(true); }}>
                    <Plus size={18} />
                    إضافة فرع
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">
                        <Warehouse size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{branches.filter(b => b.isWarehouse).length}</div>
                        <div className="stat-label">المخازن الرئيسية</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success">
                        <MapPin size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{branches.filter(b => !b.isWarehouse).length}</div>
                        <div className="stat-label">الفروع</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning">
                        <MapPin size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{branches.filter(b => b.isActive).length}</div>
                        <div className="stat-label">الفروع النشطة</div>
                    </div>
                </div>
            </div>

            {/* Branches Grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <div className="loading-spinner" />
                </div>
            ) : (
                <div className="grid grid-cols-3">
                    {branches.map((branch) => (
                        <div key={branch.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 'var(--border-radius)',
                                            background: branch.isWarehouse ? 'var(--color-primary-100)' : 'var(--color-success-50)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {branch.isWarehouse ? <Warehouse size={24} color="var(--color-primary-600)" /> : <MapPin size={24} color="var(--color-success-600)" />}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{branch.name}</h4>
                                            <span className={`badge ${branch.isWarehouse ? 'badge-primary' : 'badge-success'}`} style={{ marginTop: 4 }}>
                                                {branch.isWarehouse ? 'مخزن رئيسي' : 'فرع'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`badge ${branch.isActive ? 'badge-success' : 'badge-gray'}`}>
                                        {branch.isActive ? 'نشط' : 'معطل'}
                                    </span>
                                </div>

                                {branch.address && (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                                        📍 {branch.address}
                                    </p>
                                )}
                                {branch.phone && (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                                        📞 {branch.phone}
                                    </p>
                                )}

                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleEdit(branch)}>
                                        <Edit2 size={14} />
                                        تعديل
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(branch.id)} style={{ color: 'var(--color-danger-500)' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">اسم الفرع</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="مثال: فرع المعادي"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">العنوان</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="العنوان الكامل"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="02-12345678"
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.isWarehouse}
                                            onChange={(e) => setFormData({ ...formData, isWarehouse: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        مخزن رئيسي
                                    </label>
                                    <p className="form-hint">المخازن الرئيسية تستقبل البضائع من الموردين وتوزعها على الفروع</p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    إلغاء
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingBranch ? 'تحديث' : 'إضافة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
