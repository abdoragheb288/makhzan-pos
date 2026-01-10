import { useState, useEffect } from 'react';
import { Plus, ArrowLeftRight, Check, X, Clock, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { transferService, branchService, inventoryService } from '../services';
import { formatDateTime, getStatusLabel, getStatusColor, formatNumber } from '../utils/helpers';

export default function Transfers() {
    const [transfers, setTransfers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        fromBranchId: '',
        toBranchId: '',
        items: [],
        notes: '',
    });
    const [availableProducts, setAvailableProducts] = useState([]);

    useEffect(() => {
        fetchTransfers();
        fetchBranches();
    }, []);

    const fetchTransfers = async () => {
        try {
            const response = await transferService.getAll({ limit: 50 });
            if (response.success) {
                setTransfers(response.data);
            }
        } catch (error) {
            console.error('Error fetching transfers:', error);
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

    const handleBranchChange = async (branchId) => {
        setFormData({ ...formData, fromBranchId: branchId, items: [] });
        if (branchId) {
            try {
                const response = await inventoryService.getByBranch(branchId, { limit: 100 });
                if (response.success) {
                    setAvailableProducts(response.data.filter(i => i.quantity > 0));
                }
            } catch (error) {
                console.error('Error fetching inventory:', error);
            }
        }
    };

    const handleAddItem = (item) => {
        const exists = formData.items.find(i => i.variantId === item.variantId);
        if (exists) {
            toast.error('المنتج موجود بالفعل');
            return;
        }
        setFormData({
            ...formData,
            items: [...formData.items, {
                variantId: item.variantId,
                productName: item.variant?.product?.name,
                variantInfo: `${item.variant?.size} - ${item.variant?.color || ''}`,
                quantity: 1,
                maxQuantity: item.quantity,
            }]
        });
    };

    const handleUpdateItem = (variantId, quantity) => {
        setFormData({
            ...formData,
            items: formData.items.map(item =>
                item.variantId === variantId ? { ...item, quantity: Math.min(quantity, item.maxQuantity) } : item
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
            await transferService.create({
                fromBranchId: parseInt(formData.fromBranchId),
                toBranchId: parseInt(formData.toBranchId),
                items: formData.items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
                notes: formData.notes,
            });
            toast.success('تم إنشاء طلب النقل');
            setShowModal(false);
            setFormData({ fromBranchId: '', toBranchId: '', items: [], notes: '' });
            fetchTransfers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await transferService.updateStatus(id, status);
            toast.success('تم تحديث الحالة');
            fetchTransfers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={16} />;
            case 'APPROVED': return <Check size={16} />;
            case 'IN_TRANSIT': return <Truck size={16} />;
            case 'COMPLETED': return <Check size={16} />;
            case 'CANCELLED': return <X size={16} />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>نقل البضائع</h1>
                    <p>إدارة طلبات نقل المخزون بين الفروع</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    طلب نقل جديد
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{transfers.filter(t => t.status === 'PENDING').length}</div>
                        <div className="stat-label">قيد الانتظار</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary">
                        <Truck size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{transfers.filter(t => t.status === 'IN_TRANSIT').length}</div>
                        <div className="stat-label">في الطريق</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success">
                        <Check size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{transfers.filter(t => t.status === 'COMPLETED').length}</div>
                        <div className="stat-label">مكتمل</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-danger">
                        <X size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{transfers.filter(t => t.status === 'CANCELLED').length}</div>
                        <div className="stat-label">ملغي</div>
                    </div>
                </div>
            </div>

            {/* Transfers Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <div className="loading-spinner" />
                        </div>
                    ) : transfers.length === 0 ? (
                        <div className="empty-state">
                            <ArrowLeftRight size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد طلبات نقل</div>
                            <p className="empty-state-text">قم بإنشاء طلب نقل جديد لنقل البضائع بين الفروع</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>رقم الطلب</th>
                                    <th>من</th>
                                    <th>إلى</th>
                                    <th>عدد الأصناف</th>
                                    <th>الحالة</th>
                                    <th>التاريخ</th>
                                    <th style={{ width: 150 }}>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map((transfer) => (
                                    <tr key={transfer.id}>
                                        <td style={{ fontWeight: 600 }}>#{transfer.id}</td>
                                        <td>{transfer.fromBranch?.name}</td>
                                        <td>{transfer.toBranch?.name}</td>
                                        <td>{transfer._count?.items || transfer.items?.length} أصناف</td>
                                        <td>
                                            <span className={`badge badge-${getStatusColor(transfer.status)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                {getStatusIcon(transfer.status)}
                                                {getStatusLabel(transfer.status)}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {formatDateTime(transfer.createdAt)}
                                        </td>
                                        <td>
                                            {transfer.status === 'PENDING' && (
                                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(transfer.id, 'APPROVED')}>
                                                        موافقة
                                                    </button>
                                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger-500)' }} onClick={() => handleUpdateStatus(transfer.id, 'CANCELLED')}>
                                                        إلغاء
                                                    </button>
                                                </div>
                                            )}
                                            {transfer.status === 'APPROVED' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(transfer.id, 'IN_TRANSIT')}>
                                                    بدء النقل
                                                </button>
                                            )}
                                            {transfer.status === 'IN_TRANSIT' && (
                                                <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(transfer.id, 'COMPLETED')}>
                                                    تم الاستلام
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
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">طلب نقل جديد</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">من فرع</label>
                                        <select
                                            value={formData.fromBranchId}
                                            onChange={(e) => handleBranchChange(e.target.value)}
                                            required
                                        >
                                            <option value="">اختر الفرع</option>
                                            {branches.map((branch) => (
                                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">إلى فرع</label>
                                        <select
                                            value={formData.toBranchId}
                                            onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })}
                                            required
                                        >
                                            <option value="">اختر الفرع</option>
                                            {branches.filter(b => b.id !== parseInt(formData.fromBranchId)).map((branch) => (
                                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {formData.fromBranchId && availableProducts.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">اختر المنتجات</label>
                                        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-sm)' }}>
                                            {availableProducts.map((item) => (
                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{item.variant?.product?.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.variant?.size} - {item.variant?.color} (متوفر: {item.quantity})</div>
                                                    </div>
                                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleAddItem(item)}>
                                                        <Plus size={14} /> إضافة
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formData.items.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">المنتجات المختارة</label>
                                        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' }}>
                                            {formData.items.map((item) => (
                                                <div key={item.variantId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.variantInfo}</div>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.maxQuantity}
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(item.variantId, parseInt(e.target.value) || 1)}
                                                        style={{ width: 80 }}
                                                    />
                                                    <button type="button" className="btn btn-ghost btn-icon" style={{ color: 'var(--color-danger-500)' }} onClick={() => handleRemoveItem(item.variantId)}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

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
                                <button type="submit" className="btn btn-primary">إنشاء الطلب</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
