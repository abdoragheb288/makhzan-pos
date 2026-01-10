import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Folder, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryService } from '../services';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parentId: '',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getTree();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData };
            if (!data.parentId) delete data.parentId;
            else data.parentId = parseInt(data.parentId);

            if (editingCategory) {
                await categoryService.update(editingCategory.id, data);
                toast.success('تم تحديث التصنيف');
            } else {
                await categoryService.create(data);
                toast.success('تم إضافة التصنيف');
            }
            setShowModal(false);
            resetForm();
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({ name: '', description: '', parentId: '' });
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            parentId: category.parentId || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
        try {
            await categoryService.delete(id);
            toast.success('تم حذف التصنيف');
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ أثناء الحذف');
        }
    };

    const flatCategories = [];
    const flattenCategories = (cats, level = 0) => {
        cats.forEach(cat => {
            flatCategories.push({ ...cat, level });
            if (cat.children && cat.children.length > 0) {
                flattenCategories(cat.children, level + 1);
            }
        });
    };
    flattenCategories(categories);

    const renderCategoryItem = (category, level = 0) => (
        <div key={category.id}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-md)',
                    paddingRight: `calc(var(--spacing-md) + ${level * 24}px)`,
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: level > 0 ? 'var(--color-gray-50)' : 'transparent',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    {category.children && category.children.length > 0 ? (
                        <FolderOpen size={20} color="var(--color-warning-500)" />
                    ) : (
                        <Folder size={20} color="var(--color-primary-500)" />
                    )}
                    <div>
                        <div style={{ fontWeight: 600 }}>{category.name}</div>
                        {category.description && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{category.description}</div>
                        )}
                    </div>
                    {category._count?.products > 0 && (
                        <span className="badge badge-gray">{category._count.products} منتج</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(category)}>
                        <Edit2 size={16} />
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(category.id)} style={{ color: 'var(--color-danger-500)' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            {category.children && category.children.map(child => renderCategoryItem(child, level + 1))}
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>التصنيفات</h1>
                    <p>إدارة تصنيفات المنتجات</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={18} />
                    إضافة تصنيف
                </button>
            </div>

            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <div className="loading-spinner" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="empty-state">
                            <Folder size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد تصنيفات</div>
                            <p className="empty-state-text">قم بإضافة تصنيفات لتنظيم المنتجات</p>
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                <Plus size={18} /> إضافة تصنيف
                            </button>
                        </div>
                    ) : (
                        <div>{categories.map(cat => renderCategoryItem(cat))}</div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">اسم التصنيف</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="مثال: ملابس رجالي"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الوصف</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder="وصف التصنيف..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">التصنيف الأب (اختياري)</label>
                                    <select
                                        value={formData.parentId}
                                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                    >
                                        <option value="">بدون تصنيف أب</option>
                                        {flatCategories
                                            .filter(c => c.id !== editingCategory?.id)
                                            .map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {'—'.repeat(cat.level)} {cat.name}
                                                </option>
                                            ))}
                                    </select>
                                    <p className="form-hint">اختر تصنيف أب إذا كان هذا تصنيف فرعي</p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary">{editingCategory ? 'تحديث' : 'إضافة'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
