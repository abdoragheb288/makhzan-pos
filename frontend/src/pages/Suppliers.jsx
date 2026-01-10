import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Truck, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { supplierService } from '../services';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await supplierService.getAll({ limit: 100 });
            if (response.success) {
                setSuppliers(response.data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await supplierService.update(editingSupplier.id, formData);
                toast.success('تم تحديث المورد');
            } else {
                await supplierService.create(formData);
                toast.success('تم إضافة المورد');
            }
            setShowModal(false);
            resetForm();
            fetchSuppliers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const resetForm = () => {
        setEditingSupplier(null);
        setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
            notes: supplier.notes || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return;
        try {
            await supplierService.delete(id);
            toast.success('تم حذف المورد');
            fetchSuppliers();
        } catch (error) {
            toast.error('حدث خطأ أثناء الحذف');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>الموردين</h1>
                    <p>إدارة الموردين ومعلومات التواصل</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={18} />
                    إضافة مورد
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <div className="loading-spinner" />
                </div>
            ) : suppliers.length === 0 ? (
                <div className="card">
                    <div className="card-body">
                        <div className="empty-state">
                            <Truck size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا يوجد موردين</div>
                            <p className="empty-state-text">قم بإضافة موردين جدد للبدء في إدارة المشتريات</p>
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                <Plus size={18} /> إضافة مورد
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-3">
                    {suppliers.map((supplier) => (
                        <div key={supplier.id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 'var(--border-radius)',
                                            background: 'var(--color-primary-100)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Truck size={24} color="var(--color-primary-600)" />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{supplier.name}</h4>
                                            <span className={`badge ${supplier.isActive ? 'badge-success' : 'badge-gray'}`}>
                                                {supplier.isActive ? 'نشط' : 'معطل'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                    {supplier.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            <Phone size={14} /> {supplier.phone}
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            <Mail size={14} /> {supplier.email}
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            <MapPin size={14} /> {supplier.address}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleEdit(supplier)}>
                                        <Edit2 size={14} /> تعديل
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(supplier.id)} style={{ color: 'var(--color-danger-500)' }}>
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
                            <h3 className="modal-title">{editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">اسم المورد</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="مثال: شركة النيل للملابس"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="01xxxxxxxxx"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="supplier@email.com"
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
                                    <label className="form-label">ملاحظات</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        placeholder="ملاحظات إضافية..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary">{editingSupplier ? 'تحديث' : 'إضافة'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
