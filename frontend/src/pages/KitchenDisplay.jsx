/**
 * Kitchen Display System (KDS)
 * Shows orders sent to kitchen for preparation
 */

import { useState, useEffect, useRef } from 'react';
import {
    ChefHat,
    Clock,
    Check,
    AlertCircle,
    Coffee,
    ShoppingBag,
    Truck,
    RefreshCw,
    Volume2,
    VolumeX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatDateTime } from '../utils/helpers';
import '../styles/kds.css';

// Order type configurations
const ORDER_TYPES = {
    takeaway: { label: 'تيك أواي', icon: ShoppingBag, color: '#10b981' },
    dine_in: { label: 'صالة', icon: Coffee, color: '#f59e0b' },
    delivery: { label: 'دليفري', icon: Truck, color: '#3b82f6' },
};

// Order status configurations
const ORDER_STATUSES = {
    pending: { label: 'جديد', color: '#ef4444' },
    preparing: { label: 'تحضير', color: '#f59e0b' },
    ready: { label: 'جاهز', color: '#10b981' },
};

export default function KitchenDisplay() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, preparing
    const audioRef = useRef(null);
    const prevOrdersRef = useRef([]);

    // Fetch orders every 10 seconds
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [filter]);

    const fetchOrders = async () => {
        try {
            const statusFilter = filter === 'all' ? 'pending,preparing,ready' : filter;
            const response = await api.get(`/orders/active?status=${statusFilter}`);

            if (response.data.success) {
                const newOrders = response.data.data;

                // Check for new orders and play sound
                if (soundEnabled && prevOrdersRef.current.length > 0) {
                    const newOrderIds = newOrders.map(o => o.id);
                    const prevOrderIds = prevOrdersRef.current.map(o => o.id);
                    const hasNewOrders = newOrderIds.some(id => !prevOrderIds.includes(id));

                    if (hasNewOrders && audioRef.current) {
                        audioRef.current.play().catch(() => { });
                    }
                }

                prevOrdersRef.current = newOrders;
                setOrders(newOrders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Update order status
    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            toast.success('تم تحديث الطلب');
            fetchOrders();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    // Mark as preparing
    const handleStartPreparing = (orderId) => {
        handleStatusUpdate(orderId, 'preparing');
    };

    // Mark as ready (bump)
    const handleBump = (orderId) => {
        handleStatusUpdate(orderId, 'ready');
    };

    // Calculate time since order
    const getTimeSince = (createdAt) => {
        const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
        if (diff < 60) return `${diff} ث`;
        if (diff < 3600) return `${Math.floor(diff / 60)} د`;
        return `${Math.floor(diff / 3600)} س`;
    };

    // Get urgency class based on time
    const getUrgencyClass = (createdAt) => {
        const minutes = (Date.now() - new Date(createdAt).getTime()) / 60000;
        if (minutes > 20) return 'urgent';
        if (minutes > 10) return 'warning';
        return 'normal';
    };

    return (
        <div className="kds-container">
            {/* Audio for notifications */}
            <audio ref={audioRef} src="/notification.mp3" preload="auto" />

            {/* Header */}
            <div className="kds-header">
                <div className="kds-title">
                    <ChefHat size={28} />
                    <h1>شاشة المطبخ</h1>
                    <span className="order-count">{orders.length} طلب</span>
                </div>

                <div className="kds-controls">
                    {/* Filter */}
                    <div className="kds-filter">
                        <button
                            className={filter === 'all' ? 'active' : ''}
                            onClick={() => setFilter('all')}
                        >
                            الكل
                        </button>
                        <button
                            className={filter === 'pending' ? 'active' : ''}
                            onClick={() => setFilter('pending')}
                        >
                            جديد
                        </button>
                        <button
                            className={filter === 'preparing' ? 'active' : ''}
                            onClick={() => setFilter('preparing')}
                        >
                            تحضير
                        </button>
                    </div>

                    {/* Sound toggle */}
                    <button
                        className={`kds-sound-btn ${soundEnabled ? 'active' : ''}`}
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                    >
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>

                    {/* Refresh */}
                    <button className="kds-refresh-btn" onClick={fetchOrders} title="تحديث">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Orders Grid */}
            <div className="kds-orders">
                {loading ? (
                    <div className="kds-loading">
                        <RefreshCw className="spin" size={32} />
                        <p>جاري التحميل...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="kds-empty">
                        <ChefHat size={64} />
                        <h2>لا توجد طلبات</h2>
                        <p>ستظهر الطلبات هنا عند إرسالها من نقطة البيع</p>
                    </div>
                ) : (
                    orders.map(order => {
                        const OrderTypeIcon = ORDER_TYPES[order.orderType]?.icon || ShoppingBag;
                        const statusConfig = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
                        const urgency = getUrgencyClass(order.sentToKitchenAt || order.createdAt);

                        return (
                            <div
                                key={order.id}
                                className={`kds-order ${order.status} ${urgency}`}
                                style={{ '--order-color': ORDER_TYPES[order.orderType]?.color }}
                            >
                                {/* Order Header */}
                                <div className="kds-order-header">
                                    <div className="order-type">
                                        <OrderTypeIcon size={16} />
                                        <span>{ORDER_TYPES[order.orderType]?.label}</span>
                                    </div>
                                    <div className="order-number">
                                        #{order.shiftOrderNumber || order.id}
                                    </div>
                                </div>

                                {/* Order Info */}
                                <div className="kds-order-info">
                                    {order.table && (
                                        <div className="info-row">
                                            <span className="label">طاولة:</span>
                                            <span className="value">{order.table.name}</span>
                                        </div>
                                    )}
                                    {order.customerName && (
                                        <div className="info-row">
                                            <span className="label">العميل:</span>
                                            <span className="value">{order.customerName}</span>
                                        </div>
                                    )}
                                    <div className="info-row time">
                                        <Clock size={14} />
                                        <span>{getTimeSince(order.sentToKitchenAt || order.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="kds-order-items">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="kds-item">
                                            <span className="item-qty">{item.quantity}×</span>
                                            <span className="item-name">{item.product?.name}</span>
                                            {item.notes && (
                                                <div className="item-notes">{item.notes}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Order Notes */}
                                {order.notes && (
                                    <div className="kds-order-notes">
                                        <AlertCircle size={14} />
                                        {order.notes}
                                    </div>
                                )}

                                {/* Action Button */}
                                <div className="kds-order-actions">
                                    {order.status === 'pending' && (
                                        <button
                                            className="kds-action-btn preparing"
                                            onClick={() => handleStartPreparing(order.id)}
                                        >
                                            <ChefHat size={18} />
                                            بدء التحضير
                                        </button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button
                                            className="kds-action-btn ready"
                                            onClick={() => handleBump(order.id)}
                                        >
                                            <Check size={18} />
                                            جاهز
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <div className="kds-ready-badge">
                                            <Check size={18} />
                                            جاهز للتقديم
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
