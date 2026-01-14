/**
 * Orders Page
 * Restaurant/Cafe order management
 * Only visible for business types with 'orders' feature enabled
 */

import { useState, useEffect } from 'react';
import { Eye, Clock, CheckCircle, XCircle, DollarSign, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';

const ORDER_STATUSES = {
    pending: { label: 'قيد الانتظار', color: 'badge-gray', icon: Clock },
    preparing: { label: 'قيد التحضير', color: 'badge-warning', icon: ChefHat },
    ready: { label: 'جاهز', color: 'badge-success', icon: CheckCircle },
    served: { label: 'تم التقديم', color: 'badge-primary', icon: CheckCircle },
    paid: { label: 'مدفوع', color: 'badge-success', icon: DollarSign },
    cancelled: { label: 'ملغي', color: 'badge-danger', icon: XCircle },
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [discount, setDiscount] = useState(0);

    useEffect(() => {
        fetchOrders();
        // Auto-refresh every 30 seconds for active orders
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [selectedStatus]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = selectedStatus ? `?status=${selectedStatus}&limit=50` : '?limit=50';
            const response = await api.get(`/orders${params}`);
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('خطأ في جلب الطلبات');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            fetchOrders();
            toast.success('تم تحديث حالة الطلب');
        } catch (error) {
            toast.error('خطأ في تحديث الحالة');
        }
    };

    const handleViewDetails = async (order) => {
        try {
            const response = await api.get(`/orders/${order.id}`);
            if (response.data.success) {
                setSelectedOrder(response.data.data);
                setShowDetailsModal(true);
            }
        } catch (error) {
            toast.error('خطأ في جلب تفاصيل الطلب');
        }
    };

    const handleCheckout = (order) => {
        setSelectedOrder(order);
        setDiscount(0);
        setPaymentMethod('CASH');
        setShowCheckoutModal(true);
    };

    const handleConfirmCheckout = async () => {
        try {
            await api.post(`/orders/${selectedOrder.id}/checkout`, {
                paymentMethod,
                discount: parseFloat(discount) || 0,
            });
            toast.success('تم إنشاء الفاتورة بنجاح');
            setShowCheckoutModal(false);
            setSelectedOrder(null);
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطأ في إنشاء الفاتورة');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
        try {
            await api.post(`/orders/${orderId}/cancel`);
            toast.success('تم إلغاء الطلب');
            fetchOrders();
        } catch (error) {
            toast.error('خطأ في إلغاء الطلب');
        }
    };

    const getStatusBadge = (status) => {
        const config = ORDER_STATUSES[status] || ORDER_STATUSES.pending;
        const Icon = config.icon;
        return (
            <span className={`badge ${config.color}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon size={14} />
                {config.label}
            </span>
        );
    };

    // Calculate stats
    const stats = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>الطلبات</h1>
                    <p>إدارة طلبات المطعم والكافيه</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedStatus('pending')}>
                    <div className="stat-icon stat-icon-gray">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">قيد الانتظار</div>
                    </div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedStatus('preparing')}>
                    <div className="stat-icon stat-icon-warning">
                        <ChefHat size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.preparing}</div>
                        <div className="stat-label">قيد التحضير</div>
                    </div>
                </div>
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedStatus('ready')}>
                    <div className="stat-icon stat-icon-success">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.ready}</div>
                        <div className="stat-label">جاهز للتقديم</div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                    className={`btn ${!selectedStatus ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedStatus('')}
                >
                    الكل
                </button>
                {Object.entries(ORDER_STATUSES).map(([key, config]) => (
                    <button
                        key={key}
                        className={`btn ${selectedStatus === key ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSelectedStatus(key)}
                    >
                        {config.label}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-state">جاري التحميل...</div>
                    ) : orders.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={48} />
                            <p>لا توجد طلبات</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>رقم الطلب</th>
                                    <th>الطاولة</th>
                                    <th>النوع</th>
                                    <th>العناصر</th>
                                    <th>الإجمالي</th>
                                    <th>الحالة</th>
                                    <th>الوقت</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td><strong>{order.orderNumber}</strong></td>
                                        <td>{order.table?.name || '-'}</td>
                                        <td>
                                            {order.orderType === 'dine_in' ? 'داخلي' :
                                                order.orderType === 'takeaway' ? 'سفري' : 'توصيل'}
                                        </td>
                                        <td>{order.items?.length || 0} عناصر</td>
                                        <td>{formatCurrency(order.total)}</td>
                                        <td>{getStatusBadge(order.status)}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            {formatDate(order.createdAt, 'HH:mm')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                <button
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => handleViewDetails(order)}
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {order.status === 'pending' && (
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => handleStatusChange(order.id, 'preparing')}
                                                        title="بدء التحضير"
                                                        style={{ color: 'var(--color-warning-500)' }}
                                                    >
                                                        <ChefHat size={16} />
                                                    </button>
                                                )}

                                                {order.status === 'preparing' && (
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => handleStatusChange(order.id, 'ready')}
                                                        title="جاهز"
                                                        style={{ color: 'var(--color-success-500)' }}
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}

                                                {order.status === 'ready' && (
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => handleStatusChange(order.id, 'served')}
                                                        title="تم التقديم"
                                                        style={{ color: 'var(--color-primary-500)' }}
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}

                                                {['pending', 'preparing', 'ready', 'served'].includes(order.status) && (
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => handleCheckout(order)}
                                                        title="الدفع"
                                                        style={{ color: 'var(--color-success-500)' }}
                                                    >
                                                        <DollarSign size={16} />
                                                    </button>
                                                )}

                                                {!['paid', 'cancelled'].includes(order.status) && (
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        title="إلغاء"
                                                        style={{ color: 'var(--color-danger-500)' }}
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            {showDetailsModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">تفاصيل الطلب #{selectedOrder.orderNumber}</h3>
                            <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                <div>
                                    <strong>الطاولة:</strong> {selectedOrder.table?.name || 'بدون طاولة'}
                                </div>
                                <div>
                                    <strong>النوع:</strong> {selectedOrder.orderType === 'dine_in' ? 'داخلي' : 'سفري'}
                                </div>
                                <div>
                                    <strong>الحالة:</strong> {getStatusBadge(selectedOrder.status)}
                                </div>
                                <div>
                                    <strong>التاريخ:</strong> {formatDate(selectedOrder.createdAt)}
                                </div>
                            </div>

                            <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>العناصر</h4>
                            <table className="table" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <thead>
                                    <tr>
                                        <th>المنتج</th>
                                        <th>الكمية</th>
                                        <th>السعر</th>
                                        <th>الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items?.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                {item.product?.name}
                                                {item.notes && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{item.notes}</div>}
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.unitPrice)}</td>
                                            <td>{formatCurrency(parseFloat(item.unitPrice) * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ textAlign: 'left', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    الإجمالي: {formatCurrency(selectedOrder.total)}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>إغلاق</button>
                            {!['paid', 'cancelled'].includes(selectedOrder.status) && (
                                <button className="btn btn-primary" onClick={() => { setShowDetailsModal(false); handleCheckout(selectedOrder); }}>
                                    الدفع
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckoutModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">الدفع - طلب #{selectedOrder.orderNumber}</h3>
                            <button className="modal-close" onClick={() => setShowCheckoutModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>
                                    المجموع: {formatCurrency(parseFloat(selectedOrder.total) - parseFloat(discount))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">طريقة الدفع</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="CASH">نقداً</option>
                                    <option value="CARD">بطاقة</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">الخصم</label>
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    min="0"
                                    max={selectedOrder.total}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>إلغاء</button>
                            <button className="btn btn-primary" onClick={handleConfirmCheckout}>
                                تأكيد الدفع وإنشاء الفاتورة
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
