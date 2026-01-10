import { useState, useEffect, useMemo } from 'react';
import { Plus, FileText, Check, Clock, X, Package, Search, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchaseService, supplierService, branchService, posService } from '../services';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '../utils/helpers';

export default function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [formData, setFormData] = useState({
        supplierId: '',
        branchId: '',
        notes: '',
        items: [],
        autoReceive: false,
    });

    useEffect(() => {
        fetchPurchases();
        fetchSuppliers();
        fetchBranches();
        fetchProducts();
    }, []);

    const fetchPurchases = async () => {
        try {
            const response = await purchaseService.getAll({ limit: 50 });
            if (response.success) {
                setPurchases(response.data);
            }
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await supplierService.getAll({ limit: 100 });
            if (response.success) setSuppliers(response.data);
        } catch (error) { console.error(error); }
    };

    const fetchBranches = async () => {
        try {
            const response = await branchService.getAll({ limit: 100 });
            if (response.success) setBranches(response.data);
        } catch (error) { console.error(error); }
    };

    const fetchProducts = async () => {
        try {
            const response = await posService.getProducts({ limit: 1000 });
            if (response.success) setProducts(response.data);
        } catch (error) { console.error(error); }
    };

    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku?.toLowerCase().includes(productSearch.toLowerCase())
        );
    }, [products, productSearch]);

    const handleAddItem = (variant, product) => {
        const exists = formData.items.find(i => i.variantId === variant.variantId);
        if (exists) {
            toast.error('المنتج موجود بالفعل');
            return;
        }
        setFormData({
            ...formData,
            items: [...formData.items, {
                variantId: variant.variantId,
                productName: product.name,
                variantInfo: `${variant.size} - ${variant.color}`,
                quantity: 1,
                unitCost: variant.costPrice || 0,
            }]
        });
    };

    const handleUpdateItem = (variantId, field, value) => {
        setFormData({
            ...formData,
            items: formData.items.map(item =>
                item.variantId === variantId ? { ...item, [field]: value } : item
            )
        });
    };

    const handleRemoveItem = (variantId) => {
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.variantId !== variantId)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) {
            toast.error('يجب إضافة منتج واحد على الأقل');
            return;
        }
        try {
            await purchaseService.create(formData);
            toast.success('تم إنشاء أمر الشراء');
            setShowModal(false);
            setFormData({ supplierId: '', branchId: '', notes: '', items: [], autoReceive: false });
            fetchPurchases();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleReceive = async (id) => {
        try {
            const purchase = purchases.find(p => p.id === id);
            if (!purchase) return;
            const itemsToReceive = purchase.items.map(item => ({
                itemId: item.id,
                receivedQuantity: item.quantity - item.received
            }));

            await purchaseService.receive(id, itemsToReceive);
            toast.success('تم استلام الطلب');
            fetchPurchases();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('هل أنت متأكد من إلغاء أمر الشراء؟')) return;
        try {
            await purchaseService.cancel(id);
            toast.success('تم إلغاء الطلب');
            fetchPurchases();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={16} />;
            case 'PARTIAL': return <Package size={16} />;
            case 'RECEIVED': return <Check size={16} />;
            case 'CANCELLED': return <X size={16} />;
            default: return null;
        }
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>أوامر الشراء</h1>
                    <p>إدارة أوامر الشراء من الموردين</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    أمر شراء جديد
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                {/* Stats cards remain unchanged for brevity, reusing existing structure if possible, but writing full for correctness */}
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><Clock size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{purchases.filter(p => p.status === 'PENDING').length}</div>
                        <div className="stat-label">قيد الانتظار</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><Package size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{purchases.filter(p => p.status === 'PARTIAL').length}</div>
                        <div className="stat-label">استلام جزئي</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><Check size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{purchases.filter(p => p.status === 'RECEIVED').length}</div>
                        <div className="stat-label">مستلم</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-danger"><X size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{purchases.filter(p => p.status === 'CANCELLED').length}</div>
                        <div className="stat-label">ملغي</div>
                    </div>
                </div>
            </div>

            {/* Purchases Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <div className="loading-spinner" />
                        </div>
                    ) : purchases.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد أوامر شراء</div>
                            <p className="empty-state-text">قم بإنشاء أمر شراء جديد لطلب بضائع من الموردين</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>رقم الطلب</th>
                                    <th>المورد</th>
                                    <th>الفرع</th>
                                    <th>عدد الأصناف</th>
                                    <th>الإجمالي</th>
                                    <th>الحالة</th>
                                    <th>التاريخ</th>
                                    <th style={{ width: 150 }}>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map((purchase) => (
                                    <tr key={purchase.id}>
                                        <td style={{ fontWeight: 600 }}>#{purchase.id}</td>
                                        <td>{purchase.supplier?.name}</td>
                                        <td>{purchase.branch?.name}</td>
                                        <td>{purchase._count?.items || purchase.items?.length} أصناف</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(purchase.total)}</td>
                                        <td>
                                            <span className={`badge badge-${getStatusColor(purchase.status)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                {getStatusIcon(purchase.status)}
                                                {getStatusLabel(purchase.status)}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {formatDateTime(purchase.createdAt)}
                                        </td>
                                        <td>
                                            {purchase.status === 'PENDING' && (
                                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleReceive(purchase.id)}>
                                                        استلام
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger-500)' }} onClick={() => handleCancel(purchase.id)}>
                                                        إلغاء
                                                    </button>
                                                </div>
                                            )}
                                            {purchase.status === 'PARTIAL' && (
                                                <button className="btn btn-success btn-sm" onClick={() => handleReceive(purchase.id)}>
                                                    استلام الباقي
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

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-xl" onClick={(e) => e.stopPropagation()} style={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ background: 'var(--color-primary-50)', padding: 8, borderRadius: 8 }}>
                                    <FileText className="text-primary-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="modal-title">أمر شراء جديد</h3>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>إنشاء فاتورة مشتريات جديدة وإضافتها للمخزون</p>
                                </div>
                            </div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--spacing-xl)' }}>

                                {/* Right Column: Order Details & Items */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

                                    {/* Header Inputs */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">المورد</label>
                                            <select
                                                className="form-input"
                                                value={formData.supplierId}
                                                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                                required
                                            >
                                                <option value="">اختر المورد</option>
                                                {suppliers.map((supplier) => (
                                                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">الفرع المستلم</label>
                                            <select
                                                className="form-input"
                                                value={formData.branchId}
                                                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                                required
                                            >
                                                <option value="">اختر الفرع</option>
                                                {branches.map((branch) => (
                                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Selected Items Table */}
                                    <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--color-gray-50)', fontWeight: 600, fontSize: '0.875rem' }}>
                                            المنتجات المختارة ({formData.items.length})
                                        </div>

                                        <div style={{ flex: 1, overflowY: 'auto' }}>
                                            {formData.items.length === 0 ? (
                                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: 40 }}>
                                                    <Package size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                                                    <p>لم يتم اختيار منتجات بعد</p>
                                                    <p style={{ fontSize: '0.8rem' }}>قم باختيار المنتجات من القائمة الجانبية</p>
                                                </div>
                                            ) : (
                                                <table style={{ width: '100%' }}>
                                                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                                                        <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            <th style={{ padding: '8px 16px', textAlign: 'right' }}>المنتج</th>
                                                            <th style={{ padding: '8px', width: 100 }}>الكمية</th>
                                                            <th style={{ padding: '8px', width: 120 }}>التكلفة</th>
                                                            <th style={{ padding: '8px', width: 120 }}>الإجمالي</th>
                                                            <th style={{ padding: '8px', width: 40 }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formData.items.map((item) => (
                                                            <tr key={item.variantId} style={{ borderBottom: '1px solid var(--border-color-light)' }}>
                                                                <td style={{ padding: '8px 16px' }}>
                                                                    <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.variantInfo}</div>
                                                                </td>
                                                                <td style={{ padding: '8px' }}>
                                                                    <input
                                                                        type="number" min="1"
                                                                        value={item.quantity}
                                                                        onChange={(e) => handleUpdateItem(item.variantId, 'quantity', e.target.value)}
                                                                        className="form-input-sm"
                                                                        style={{ width: '100%', textAlign: 'center' }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '8px' }}>
                                                                    <input
                                                                        type="number" min="0" step="0.01"
                                                                        value={item.unitCost}
                                                                        onChange={(e) => handleUpdateItem(item.variantId, 'unitCost', e.target.value)}
                                                                        className="form-input-sm"
                                                                        style={{ width: '100%', textAlign: 'center' }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '8px', fontWeight: 600 }}>
                                                                    {formatCurrency(item.quantity * item.unitCost)}
                                                                </td>
                                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                                    <button type="button" onClick={() => handleRemoveItem(item.variantId)} style={{ color: 'var(--color-danger-500)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>

                                        <div style={{ padding: '16px', background: 'var(--color-gray-50)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 500 }}>إجمالي الفاتورة:</span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                                                {formatCurrency(calculateTotal())}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={2}
                                            className="form-input"
                                            placeholder="ملاحظات إضافية على الفاتورة..."
                                            style={{ resize: 'none' }}
                                        />
                                    </div>
                                </div>

                                {/* Left Column: Product Selection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', borderRight: '1px solid var(--border-color)', paddingRight: 'var(--spacing-xl)' }}>
                                    <div className="search-input">
                                        <Search className="search-icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="بحث عن منتج..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'var(--bg-primary)' }}>
                                        {loading ? (
                                            <div style={{ padding: 20, textAlign: 'center' }}>جاري التحميل...</div>
                                        ) : filteredProducts.length === 0 ? (
                                            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد منتجات</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {filteredProducts.map(product => (
                                                    product.variants?.map(variant => (
                                                        <div
                                                            key={`${product.id}-${variant.variantId}`}
                                                            style={{
                                                                padding: '12px',
                                                                borderBottom: '1px solid var(--border-color-light)',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            className="hover:bg-gray-50"
                                                            onClick={() => handleAddItem(variant, product)}
                                                        >
                                                            <div>
                                                                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{product.name}</div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                                    <span style={{ background: 'var(--color-gray-100)', padding: '2px 6px', borderRadius: 4 }}>{variant.size}</span>
                                                                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: variant.color }}></span>
                                                                    <span>{variant.sku}</span>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, background: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
                                                                <Plus size={16} />
                                                            </div>
                                                        </div>
                                                    ))
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        اضغط على المنتج لإضافته للفاتورة
                                    </div>
                                </div>

                            </div>

                            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--color-success-600)', background: 'var(--color-success-50)', padding: '8px 16px', borderRadius: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.autoReceive}
                                        onChange={(e) => setFormData({ ...formData, autoReceive: e.target.checked })}
                                        style={{ width: 18, height: 18 }}
                                    />
                                    <span>استلام فوري (إضافة للمخزون)</span>
                                </label>

                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading || formData.items.length === 0}>
                                        <Check size={18} /> حفظ الفاتورة
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
