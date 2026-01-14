import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService, categoryService } from '../services';
import { formatCurrency } from '../utils/helpers';
import { useBusinessConfig } from '../store';

export default function Products() {
    const businessConfig = useBusinessConfig();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewingProduct, setViewingProduct] = useState(null);
    const [saving, setSaving] = useState(false);

    // Get UI config from business type
    const ui = businessConfig?.ui || {};
    const placeholders = ui.placeholders || {};
    const terminology = ui.terminology || {};
    const formConfig = ui.forms?.product || {};
    const showVariants = businessConfig?.features?.variants ?? true;

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        barcode: '',
        categoryId: '',
        basePrice: '',
        costPrice: '',
        description: '',
        variants: [{ size: '', color: '', price: '', costPrice: '' }],
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [pagination.page, selectedCategory]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await productService.getAll({
                page: pagination.page,
                limit: 10,
                search: search || undefined,
                categoryId: selectedCategory || undefined,
            });
            if (response.success) {
                setProducts(response.data);
                if (response.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        totalPages: response.pagination.totalPages || 1,
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('حدث خطأ في تحميل المنتجات');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getAll({ limit: 100 });
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination({ ...pagination, page: 1 });
        fetchProducts();
    };

    const resetForm = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            sku: '',
            barcode: '',
            categoryId: '',
            basePrice: '',
            costPrice: '',
            description: '',
            variants: [{ size: '', color: '', price: '', costPrice: '' }],
        });
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku || '',
            barcode: product.barcode || '',
            categoryId: product.categoryId?.toString() || '',
            basePrice: product.basePrice?.toString() || '',
            costPrice: product.costPrice?.toString() || '',
            description: product.description || '',
            variants: product.variants?.length > 0
                ? product.variants.map(v => ({
                    id: v.id,
                    size: v.size || '',
                    color: v.color || '',
                    price: v.price?.toString() || '',
                    costPrice: v.costPrice?.toString() || '',
                }))
                : [{ size: '', color: '', price: '', costPrice: '' }],
        });
        setShowModal(true);
    };

    const handleAddVariant = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, { size: '', color: '', price: '', costPrice: '' }],
        });
    };

    const handleRemoveVariant = (index) => {
        if (formData.variants.length > 1) {
            setFormData({
                ...formData,
                variants: formData.variants.filter((_, i) => i !== index),
            });
        }
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...formData.variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setFormData({ ...formData, variants: newVariants });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.categoryId || !formData.basePrice) {
            toast.error('يرجى ملء الحقول المطلوبة');
            return;
        }

        setSaving(true);
        try {
            const data = {
                name: formData.name,
                sku: formData.sku || undefined,
                barcode: formData.barcode || undefined,
                categoryId: parseInt(formData.categoryId),
                basePrice: parseFloat(formData.basePrice),
                costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
                description: formData.description || undefined,
                variants: formData.variants
                    .filter(v => v.size || v.color)
                    .map(v => ({
                        size: v.size || 'افتراضي',
                        color: v.color || '',
                        price: parseFloat(v.price) || parseFloat(formData.basePrice),
                        costPrice: parseFloat(v.costPrice) || parseFloat(formData.costPrice) || 0,
                    })),
            };

            if (editingProduct) {
                await productService.update(editingProduct.id, data);
                toast.success('تم تحديث المنتج بنجاح');
            } else {
                // Ensure at least one variant if none provided
                if (data.variants.length === 0) {
                    data.variants = [{
                        size: 'افتراضي',
                        color: '',
                        price: data.basePrice,
                        costPrice: data.costPrice,
                    }];
                }
                await productService.create(data);
                toast.success('تم إضافة المنتج بنجاح');
            }

            setShowModal(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            const message = error.response?.data?.message || 'حدث خطأ أثناء الحفظ';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

        try {
            await productService.delete(id);
            toast.success('تم حذف المنتج');
            fetchProducts();
        } catch (error) {
            toast.error('حدث خطأ أثناء الحذف');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>{terminology.products || 'المنتجات'}</h1>
                    <p>إدارة {terminology.products || 'المنتجات'} {showVariants ? 'والمتغيرات' : ''}</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        <Plus size={18} />
                        إضافة {terminology.product || 'منتج'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-body" style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                    <form onSubmit={handleSearch} className="search-input" style={{ flex: 1 }}>
                        <input
                            type="text"
                            placeholder={placeholders.searchProducts || 'بحث عن منتج...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="search-icon" size={18} />
                    </form>

                    <select
                        value={selectedCategory}
                        onChange={(e) => { setSelectedCategory(e.target.value); setPagination({ ...pagination, page: 1 }); }}
                        style={{ width: 200 }}
                    >
                        <option value="">كل التصنيفات</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <div className="loading-spinner" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="empty-state">
                            <Package size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد منتجات</div>
                            <p className="empty-state-text">قم بإضافة منتجات جديدة للبدء</p>
                            <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                                <Plus size={18} />
                                إضافة منتج
                            </button>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>المنتج</th>
                                    <th>الكود</th>
                                    <th>التصنيف</th>
                                    <th>السعر</th>
                                    <th>المتغيرات</th>
                                    <th>الحالة</th>
                                    <th style={{ width: 120 }}>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                <div style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 'var(--border-radius)',
                                                    background: 'var(--color-primary-50)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--color-primary-600)',
                                                    fontWeight: 700,
                                                }}>
                                                    {product.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                        {product.sku}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><code style={{ background: 'var(--color-gray-100)', padding: '4px 8px', borderRadius: 4 }}>{product.barcode || '-'}</code></td>
                                        <td>{product.category?.name}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(product.basePrice)}</td>
                                        <td>
                                            <span className="badge badge-primary">{product._count?.variants || 0} متغير</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${product.isActive ? 'badge-success' : 'badge-gray'}`}>
                                                {product.isActive ? 'نشط' : 'معطل'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                <button className="btn btn-ghost btn-icon" title="عرض" onClick={() => setViewingProduct(product)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="btn btn-ghost btn-icon" title="تعديل" onClick={() => handleEdit(product)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn btn-ghost btn-icon" title="حذف" onClick={() => handleDelete(product.id)} style={{ color: 'var(--color-danger-500)' }}>
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="card-footer" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            >
                                السابق
                            </button>
                            <span style={{ padding: '0 var(--spacing-md)' }}>
                                {pagination.page} من {pagination.totalPages}
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Product Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">اسم {terminology.product || 'المنتج'} *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder={placeholders.productName || 'مثال: تيشيرت قطن'}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{terminology.category || 'التصنيف'} *</label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                            required
                                        >
                                            <option value="">اختر {terminology.category || 'التصنيف'}</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">رمز المنتج (SKU)</label>
                                        <input
                                            type="text"
                                            value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                            placeholder="يُنشأ تلقائياً إذا تُرك فارغاً"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">الباركود</label>
                                        <input
                                            type="text"
                                            value={formData.barcode}
                                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                            placeholder="اختياري"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">سعر البيع *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">سعر التكلفة</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.costPrice}
                                            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">الوصف</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        placeholder={placeholders.productDescription || 'وصف المنتج...'}
                                    />
                                </div>

                                {/* Variants Section - Only show if variants are enabled for this business type */}
                                {showVariants && (
                                    <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-lg)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                            <h4 style={{ margin: 0 }}>المتغيرات (المقاسات والألوان)</h4>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddVariant}>
                                                <Plus size={14} /> إضافة متغير
                                            </button>
                                        </div>

                                        {formData.variants.map((variant, index) => (
                                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', alignItems: 'end' }}>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>المقاس</label>
                                                    <input
                                                        type="text"
                                                        value={variant.size}
                                                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                                        placeholder="S, M, L..."
                                                    />
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>اللون</label>
                                                    <input
                                                        type="text"
                                                        value={variant.color}
                                                        onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                                        placeholder="أبيض، أسود..."
                                                    />
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>السعر</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={variant.price}
                                                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                                        placeholder={formData.basePrice || '0.00'}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ margin: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>التكلفة</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={variant.costPrice}
                                                        onChange={(e) => handleVariantChange(index, 'costPrice', e.target.value)}
                                                        placeholder={formData.costPrice || '0.00'}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => handleRemoveVariant(index)}
                                                    style={{ color: 'var(--color-danger-500)', marginBottom: 4 }}
                                                    disabled={formData.variants.length === 1}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <p className="form-hint" style={{ marginTop: 'var(--spacing-sm)' }}>
                                            أضف متغيرات مختلفة للمنتج (مقاسات، ألوان) مع أسعار مختلفة إذا لزم الأمر
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'جاري الحفظ...' : editingProduct ? 'تحديث' : 'إضافة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Product Modal */}
            {viewingProduct && (
                <div className="modal-overlay" onClick={() => setViewingProduct(null)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">تفاصيل المنتج</h3>
                            <button className="modal-close" onClick={() => setViewingProduct(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-lg)' }}>
                                {/* Product Image/Info */}
                                <div>
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '1/1',
                                        background: 'var(--color-gray-100)',
                                        borderRadius: 'var(--border-radius)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '4rem',
                                        color: 'var(--color-gray-400)',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        {viewingProduct.image ? (
                                            <img src={viewingProduct.image} alt={viewingProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--border-radius)' }} />
                                        ) : (
                                            viewingProduct.name.charAt(0)
                                        )}
                                    </div>
                                </div>

                                {/* Details */}
                                <div>
                                    <h2 style={{ margin: '0 0 var(--spacing-sm)' }}>{viewingProduct.name}</h2>
                                    <div style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                                        {viewingProduct.sku}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                        <div>
                                            <div className="label">التصنيف</div>
                                            <div className="value">{viewingProduct.category?.name || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="label">السعر الأساسي</div>
                                            <div className="value" style={{ fontWeight: 700, color: 'var(--color-primary-600)' }}>
                                                {formatCurrency(viewingProduct.basePrice)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="label">الباركود</div>
                                            <div className="value">{viewingProduct.barcode || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="label">الحالة</div>
                                            <div className="value">
                                                <span className={`badge ${viewingProduct.isActive ? 'badge-success' : 'badge-gray'}`}>
                                                    {viewingProduct.isActive ? 'نشط' : 'معطل'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>المتغيرات ({viewingProduct.variants?.length || 0})</h4>
                                        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' }}>
                                            <table style={{ margin: 0 }}>
                                                <thead style={{ position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
                                                    <tr>
                                                        <th style={{ padding: '8px 12px' }}>المقاس</th>
                                                        <th style={{ padding: '8px 12px' }}>اللون</th>
                                                        <th style={{ padding: '8px 12px' }}>السعر</th>
                                                        <th style={{ padding: '8px 12px' }}>الكود</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {viewingProduct.variants?.map((v, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                            <td style={{ padding: '8px 12px' }}>{v.size || '-'}</td>
                                                            <td style={{ padding: '8px 12px' }}>{v.color || '-'}</td>
                                                            <td style={{ padding: '8px 12px' }}>{formatCurrency(v.price)}</td>
                                                            <td style={{ padding: '8px 12px' }}><code style={{ fontSize: '0.75rem' }}>{v.sku}</code></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {viewingProduct.description && (
                                <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)' }}>
                                    <h4>الوصف</h4>
                                    <p style={{ color: 'var(--text-secondary)' }}>{viewingProduct.description}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setViewingProduct(null)}>إغلاق</button>
                            <button className="btn btn-primary" onClick={() => { setViewingProduct(null); handleEdit(viewingProduct); }}>
                                <Edit2 size={16} /> تعديل
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
