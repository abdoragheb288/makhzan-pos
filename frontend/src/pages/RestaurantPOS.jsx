/**
 * RestaurantPOS - Complete Restaurant POS with 3 Order Types
 * Order Types: Takeaway (تيك أواي) | Dine-in (صالة) | Delivery (دليفري)
 */

import { useState, useEffect, useRef } from 'react';
import {
    Search,
    Barcode,
    Plus,
    Minus,
    Trash2,
    Send,
    Printer,
    CreditCard,
    Banknote,
    ShoppingBag,
    Coffee,
    Truck,
    X,
    User,
    Phone,
    MapPin,
    Check,
    Loader2,
    ArrowLeftRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { usePosStore, useAuthStore } from '../store';
import { formatCurrency, formatNumber } from '../utils/helpers';
import ShiftWidget from '../components/ShiftWidget';
import '../styles/pos.css';

// Order Type Configurations
const ORDER_TYPES = {
    takeaway: {
        id: 'takeaway',
        label: 'تيك أواي',
        labelEn: 'Takeaway',
        icon: ShoppingBag,
        color: '#10b981', // green
    },
    dine_in: {
        id: 'dine_in',
        label: 'صالة',
        labelEn: 'Dine-in',
        icon: Coffee,
        color: '#f59e0b', // yellow/orange
    },
    delivery: {
        id: 'delivery',
        label: 'دليفري',
        labelEn: 'Delivery',
        icon: Truck,
        color: '#3b82f6', // blue
    },
};

export default function RestaurantPOS() {
    const { user } = useAuthStore();

    // Order Type State
    const [orderType, setOrderType] = useState('takeaway');

    // Products & Categories
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Tables (for dine_in)
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [activeTableOrder, setActiveTableOrder] = useState(null);

    // Delivery Customer
    const [showDeliveryForm, setShowDeliveryForm] = useState(false);
    const [customerData, setCustomerData] = useState({
        name: '',
        phone: '',
        address: '',
    });
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [driverName, setDriverName] = useState('');
    const [searchingCustomer, setSearchingCustomer] = useState(false);

    // Cart State
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState('');

    // UI State
    const [submitting, setSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paidAmount, setPaidAmount] = useState('');

    // Last Order for Receipt
    const [lastOrder, setLastOrder] = useState(null);

    const searchRef = useRef(null);
    const barcodeRef = useRef(null);
    const phoneInputRef = useRef(null);

    // Fetch initial data
    useEffect(() => {
        fetchProducts();
        fetchCategories();
        if (orderType === 'dine_in') {
            fetchTables();
        }
    }, [selectedCategory, orderType]);

    const fetchProducts = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedCategory) params.append('categoryId', selectedCategory);
            if (searchQuery) params.append('search', searchQuery);
            params.append('limit', '100');

            const response = await api.get(`/products?${params}`);
            if (response.data.success) {
                setProducts(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories?limit=100');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchTables = async () => {
        try {
            const response = await api.get('/tables?limit=100');
            if (response.data.success) {
                setTables(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    // Search customer by phone
    const handlePhoneSearch = async () => {
        if (!customerData.phone || customerData.phone.length < 8) return;

        setSearchingCustomer(true);
        try {
            const response = await api.get(`/customers/search?phone=${customerData.phone}`);
            if (response.data.success && response.data.data) {
                const customer = response.data.data;
                setCustomerData({
                    name: customer.name,
                    phone: customer.phone,
                    address: customer.address || '',
                });
                toast.success('تم العثور على العميل');
            }
        } catch (error) {
            console.error('Customer search error:', error);
        } finally {
            setSearchingCustomer(false);
        }
    };

    // Add product to cart
    const addToCart = (product) => {
        const variant = product.variants?.[0];
        if (!variant) {
            toast.error('هذا المنتج غير متاح');
            return;
        }

        const existingIndex = cart.findIndex(item => item.variantId === variant.id);
        if (existingIndex >= 0) {
            const newCart = [...cart];
            newCart[existingIndex].quantity += 1;
            setCart(newCart);
        } else {
            setCart([...cart, {
                productId: product.id,
                variantId: variant.id,
                name: product.name,
                price: parseFloat(variant.price),
                quantity: 1,
            }]);
        }
    };

    // Update quantity
    const updateQuantity = (variantId, delta) => {
        const newCart = cart.map(item => {
            if (item.variantId === variantId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean);
        setCart(newCart);
    };

    // Remove from cart
    const removeFromCart = (variantId) => {
        setCart(cart.filter(item => item.variantId !== variantId));
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
        setDiscount(0);
        setNotes('');
        setSelectedTable(null);
        setActiveTableOrder(null);
        setCustomerData({ name: '', phone: '', address: '' });
        setDeliveryFee(0);
        setDriverName('');
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount + (orderType === 'delivery' ? parseFloat(deliveryFee) || 0 : 0);
    const change = parseFloat(paidAmount) - total;

    // Handle order type change
    const handleOrderTypeChange = (type) => {
        if (cart.length > 0 && type !== orderType) {
            if (!confirm('تغيير نوع الطلب سيمسح السلة الحالية. متأكد؟')) {
                return;
            }
            clearCart();
        }
        setOrderType(type);

        if (type === 'delivery') {
            setShowDeliveryForm(true);
        } else {
            setShowDeliveryForm(false);
        }

        if (type === 'dine_in') {
            fetchTables();
        }
    };

    // Select table (dine_in)
    const handleSelectTable = async (table) => {
        if (table.status === 'occupied') {
            // Load existing order for this table
            try {
                const response = await api.get(`/orders?tableId=${table.id}&status=pending,preparing,ready`);
                if (response.data.success && response.data.data.length > 0) {
                    const existingOrder = response.data.data[0];
                    setActiveTableOrder(existingOrder);
                    // Load order items into cart
                    const cartItems = existingOrder.items.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        name: item.product?.name || 'منتج',
                        price: parseFloat(item.unitPrice),
                        quantity: item.quantity,
                    }));
                    setCart(cartItems);
                    toast(`طلب موجود على الطاولة #${existingOrder.shiftOrderNumber || existingOrder.id}`, { icon: 'ℹ️' });
                }
            } catch (error) {
                console.error('Error loading table order:', error);
            }
        }

        setSelectedTable(table);
        // Clear cart if new table selected and no existing order
        if (table.status !== 'occupied') {
            setCart([]);
            setActiveTableOrder(null);
        }
    };

    // Close Table (Go back to table view)
    const handleCloseTable = () => {
        setSelectedTable(null);
        setActiveTableOrder(null);
        setCart([]);
        setNotes('');
        setDiscount(0);
        fetchTables(); // Refresh status
    };

    // Send to Kitchen (for dine_in)
    const handleSendToKitchen = async () => {
        if (cart.length === 0) {
            toast.error('السلة فارغة');
            return;
        }

        if (orderType === 'dine_in' && !selectedTable) {
            toast.error('اختر طاولة أولاً');
            return;
        }

        setSubmitting(true);
        try {
            const orderData = {
                orderType,
                tableId: selectedTable?.id,
                items: cart.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                })),
                subtotal,
                discount,
                total: subtotal - discount,
                notes,
            };

            if (activeTableOrder) {
                // Update existing order
                await api.put(`/orders/${activeTableOrder.id}`, orderData);
                toast.success('تم تحديث الطلب وإرساله للمطبخ');
            } else {
                // Create new order
                const response = await api.post('/orders', orderData);
                if (response.data.success) {
                    setActiveTableOrder(response.data.data);
                    toast.success('تم إرسال الطلب للمطبخ');

                    // Update table status
                    if (selectedTable) {
                        await api.patch(`/tables/${selectedTable.id}/status`, { status: 'occupied' });
                        fetchTables();
                    }
                }
            }

            // Mark as sent to kitchen
            if (activeTableOrder || !activeTableOrder) {
                // Could add more logic here
            }

        } catch (error) {
            console.error('Error sending to kitchen:', error);
            toast.error('حدث خطأ في إرسال الطلب');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle checkout
    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('السلة فارغة');
            return;
        }

        // Validation based on order type
        if (orderType === 'delivery') {
            if (!customerData.phone) {
                toast.error('أدخل رقم هاتف العميل');
                return;
            }
        }

        if (orderType === 'dine_in' && !selectedTable && !activeTableOrder) {
            toast.error('اختر طاولة أولاً');
            return;
        }

        setShowPaymentModal(true);
        setPaidAmount(total.toString());
    };

    // Process payment
    const processPayment = async () => {
        setSubmitting(true);
        try {
            // For delivery, upsert customer first
            let customerId = null;
            if (orderType === 'delivery' && customerData.phone) {
                const customerRes = await api.post('/customers/upsert', customerData);
                if (customerRes.data.success) {
                    customerId = customerRes.data.data.id;
                }
            }

            // Create or get order
            let orderId = activeTableOrder?.id;
            let orderData = null;

            if (!orderId) {
                // Create order first
                orderData = {
                    orderType,
                    tableId: selectedTable?.id,
                    customerId,
                    customerName: customerData.name,
                    customerPhone: customerData.phone,
                    customerAddress: customerData.address,
                    deliveryFee: orderType === 'delivery' ? parseFloat(deliveryFee) || 0 : 0,
                    driverName: orderType === 'delivery' ? driverName : null,
                    items: cart.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: item.price,
                    })),
                    subtotal,
                    discount,
                    total,
                    notes,
                };

                const orderRes = await api.post('/orders', orderData);
                if (orderRes.data.success) {
                    orderId = orderRes.data.data.id;
                }
            }

            // Checkout the order
            const checkoutRes = await api.post(`/orders/${orderId}/checkout`, {
                paymentMethod,
                paidAmount: parseFloat(paidAmount),
            });

            if (checkoutRes.data.success) {
                const completedOrder = checkoutRes.data.data;
                const finalOrder = {
                    ...activeTableOrder,
                    ...(orderData || {}), // Ensure latest data if created new
                    id: orderId,
                    items: cart.map(item => ({ ...item, unitPrice: item.price })), // Simplified for receipt
                    total: total,
                    paid: paidAmount,
                    change: change,
                    invoiceNumber: completedOrder.invoiceNumber || `INV-${orderId}`
                };

                setLastOrder(finalOrder);
                toast.success('تم إتمام الطلب بنجاح');

                // Clear table if dine_in
                if (orderType === 'dine_in' && selectedTable) {
                    await api.patch(`/tables/${selectedTable.id}/status`, { status: 'available' });
                }

                // Reset
                clearCart();
                setShowPaymentModal(false);

                // Open print dialog
                setTimeout(() => {
                    window.print();
                }, 500);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.response?.data?.message || 'حدث خطأ في الدفع');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pos-container">
            {/* Order Type Selector */}
            <div className="pos-order-types">
                {Object.values(ORDER_TYPES).map(type => {
                    const Icon = type.icon;
                    const isActive = orderType === type.id;
                    return (
                        <button
                            key={type.id}
                            className={`pos-order-type-btn ${isActive ? 'active' : ''}`}
                            onClick={() => handleOrderTypeChange(type.id)}
                            style={{
                                '--type-color': type.color,
                                backgroundColor: isActive ? type.color : 'transparent',
                                borderColor: type.color,
                                color: isActive ? 'white' : type.color,
                            }}
                        >
                            <Icon size={20} />
                            <span>{type.label}</span>
                        </button>
                    );
                })}
                <div style={{ marginRight: 'auto' }}>
                    <ShiftWidget />
                </div>
            </div>

            {/* Main Content */}
            <div className="pos-content">
                {/* Left Side - Products or Tables */}
                <div className="pos-products">
                    {/* Search Bar */}
                    <div className="pos-search-bar">
                        <div className="search-input" style={{ flex: 1 }}>
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="ابحث في قائمة الطعام..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                            />
                            <Search className="search-icon" size={18} />
                        </div>
                        <div className="search-input" style={{ width: 180 }}>
                            <input
                                ref={barcodeRef}
                                type="text"
                                placeholder="باركود"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // Handle barcode search
                                    }
                                }}
                            />
                            <Barcode className="search-icon" size={18} />
                        </div>
                    </div>

                    {/* Table Selector (Dine-in only) */}
                    {orderType === 'dine_in' && !selectedTable && (
                        <div className="pos-tables-grid">
                            <h3 style={{ gridColumn: '1 / -1', marginBottom: 'var(--spacing-md)' }}>
                                اختر طاولة
                            </h3>
                            {tables.map(table => (
                                <button
                                    key={table.id}
                                    className={`pos-table-btn ${table.status}`}
                                    onClick={() => handleSelectTable(table)}
                                    style={{
                                        backgroundColor: table.status === 'available' ? '#10b981' :
                                            table.status === 'occupied' ? '#f59e0b' : '#3b82f6',
                                    }}
                                >
                                    <span className="table-name">{table.name}</span>
                                    <span className="table-capacity">{table.capacity} أشخاص</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Delivery Customer Form */}
                    {orderType === 'delivery' && showDeliveryForm && (
                        <div className="pos-delivery-form">
                            <h3>بيانات العميل</h3>
                            <div className="delivery-form-grid">
                                <div className="form-group">
                                    <label><Phone size={14} /> رقم الهاتف</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            ref={phoneInputRef}
                                            type="tel"
                                            placeholder="01xxxxxxxxx"
                                            value={customerData.phone}
                                            onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                            onBlur={handlePhoneSearch}
                                        />
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={handlePhoneSearch}
                                            disabled={searchingCustomer}
                                        >
                                            {searchingCustomer ? <Loader2 className="spin" size={16} /> : <Search size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label><User size={14} /> اسم العميل</label>
                                    <input
                                        type="text"
                                        placeholder="اسم العميل"
                                        value={customerData.name}
                                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label><MapPin size={14} /> العنوان</label>
                                    <textarea
                                        placeholder="عنوان التوصيل بالتفصيل"
                                        value={customerData.address}
                                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>سعر التوصيل</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={deliveryFee}
                                        onChange={(e) => setDeliveryFee(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>اسم السائق</label>
                                    <input
                                        type="text"
                                        placeholder="السائق"
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: 'var(--spacing-md)' }}
                                onClick={() => setShowDeliveryForm(false)}
                            >
                                <Check size={16} /> بدء الطلب
                            </button>
                        </div>
                    )}

                    {/* Products Grid */}
                    {(orderType !== 'dine_in' || selectedTable) && !showDeliveryForm && (
                        <>
                            {/* Back to Tables Button */}
                            {orderType === 'dine_in' && selectedTable && (
                                <div style={{ padding: '0 var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleCloseTable}
                                        style={{ width: 'fit-content' }}
                                    >
                                        <ArrowLeftRight size={16} /> تغيير / إغلاق الطاولة ({selectedTable.name})
                                    </button>
                                </div>
                            )}

                            {/* Categories */}
                            <div className="pos-categories">
                                <button
                                    className={`pos-category-btn ${!selectedCategory ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    الكل
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`pos-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>

                            {/* Products Grid */}
                            <div className="pos-products-grid">
                                {loading ? (
                                    <div className="loading-state">جاري التحميل...</div>
                                ) : products.length === 0 ? (
                                    <div className="empty-state">لا توجد منتجات</div>
                                ) : (
                                    products.map(product => (
                                        <button
                                            key={product.id}
                                            className="pos-product-card"
                                            onClick={() => addToCart(product)}
                                        >
                                            <div className="product-name">{product.name}</div>
                                            <div className="product-price">
                                                {formatCurrency(product.variants?.[0]?.price || product.basePrice)}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Right Side - Cart */}
                <div className="pos-cart">
                    {/* Cart Header */}
                    <div className="pos-cart-header">
                        <h3>
                            {ORDER_TYPES[orderType].label}
                            {orderType === 'dine_in' && selectedTable && ` - ${selectedTable.name}`}
                            {activeTableOrder && ` #${activeTableOrder.shiftOrderNumber || activeTableOrder.id}`}
                        </h3>
                        {cart.length > 0 && (
                            <button className="btn btn-ghost btn-sm" onClick={clearCart}>
                                <Trash2 size={16} /> مسح
                            </button>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div className="pos-cart-items">
                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <ShoppingBag size={40} />
                                <p>السلة فارغة</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.variantId} className="pos-cart-item">
                                    <div className="item-info">
                                        <div className="item-name">{item.name}</div>
                                        <div className="item-price">{formatCurrency(item.price)}</div>
                                    </div>
                                    <div className="item-actions">
                                        <button onClick={() => updateQuantity(item.variantId, -1)}>
                                            <Minus size={14} />
                                        </button>
                                        <span className="item-qty">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.variantId, 1)}>
                                            <Plus size={14} />
                                        </button>
                                        <button onClick={() => removeFromCart(item.variantId)} className="remove-btn">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="item-total">
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Summary */}
                    <div className="pos-cart-summary">
                        <div className="summary-row">
                            <span>المجموع الفرعي</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="summary-row discount">
                                <span>الخصم</span>
                                <span>-{formatCurrency(discount)}</span>
                            </div>
                        )}
                        {orderType === 'delivery' && parseFloat(deliveryFee) > 0 && (
                            <div className="summary-row">
                                <span>التوصيل</span>
                                <span>{formatCurrency(deliveryFee)}</span>
                            </div>
                        )}
                        <div className="summary-row total">
                            <span>الإجمالي</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pos-cart-actions">
                        {orderType === 'dine_in' && (
                            <button
                                className="btn btn-secondary"
                                onClick={handleSendToKitchen}
                                disabled={submitting || cart.length === 0}
                            >
                                {submitting ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                                حفظ وإرسال للمطبخ
                            </button>
                        )}
                        <button
                            className="btn btn-primary"
                            onClick={handleCheckout}
                            disabled={submitting || cart.length === 0}
                        >
                            {submitting ? <Loader2 className="spin" size={18} /> : <CreditCard size={18} />}
                            دفع وإتمام
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">الدفع</h3>
                            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="payment-total">
                                <span>المبلغ المطلوب</span>
                                <span className="amount">{formatCurrency(total)}</span>
                            </div>

                            <div className="payment-methods">
                                <button
                                    className={`payment-method ${paymentMethod === 'CASH' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('CASH')}
                                >
                                    <Banknote size={24} />
                                    <span>كاش</span>
                                </button>
                                <button
                                    className={`payment-method ${paymentMethod === 'CARD' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('CARD')}
                                >
                                    <CreditCard size={24} />
                                    <span>بطاقة</span>
                                </button>
                            </div>

                            {paymentMethod === 'CASH' && (
                                <>
                                    <div className="form-group">
                                        <label>المبلغ المدفوع</label>
                                        <input
                                            type="number"
                                            value={paidAmount}
                                            onChange={(e) => setPaidAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    {parseFloat(paidAmount) >= total && (
                                        <div className="change-display">
                                            <span>الباقي</span>
                                            <span className="change-amount">{formatCurrency(change)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                إلغاء
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={processPayment}
                                disabled={submitting || (paymentMethod === 'CASH' && parseFloat(paidAmount) < total)}
                            >
                                {submitting ? 'جاري المعالجة...' : 'تأكيد الدفع'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Receipt Component (Hidden unless printing) */}
            <div id="receipt-print-area" style={{ display: 'none' }}>
                {lastOrder && (
                    <div style={{ textAlign: 'center', direction: 'rtl', fontFamily: 'Arial, sans-serif', width: '100%' }}>

                        {/* Header */}
                        <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '10px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 5px 0' }}>مخزن POS</h2>
                            <p style={{ fontSize: '14px', margin: '2px 0' }}>{new Date().toLocaleString('ar-EG')}</p>
                            <p style={{ fontSize: '14px', margin: '2px 0' }}>رقم الفاتورة: #{lastOrder.invoiceNumber}</p>
                        </div>

                        {/* Order Type & Info */}
                        <div style={{ textAlign: 'right', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>نوع الطلب:</span>
                                <span style={{ fontSize: '18px', border: '1px solid #000', padding: '2px 8px', borderRadius: '4px' }}>
                                    {ORDER_TYPES[lastOrder.orderType]?.label || lastOrder.orderType}
                                </span>
                            </div>

                            {/* Dine-in Info */}
                            {lastOrder.tableId && (
                                <p style={{ margin: '5px 0' }}>طاولة: {tables.find(t => t.id === lastOrder.tableId)?.name}</p>
                            )}
                            {/* Delivery Info */}
                            {lastOrder.orderType === 'delivery' && (
                                <div style={{ border: '1px dashed #000', padding: '8px', marginTop: '5px', fontSize: '14px' }}>
                                    <p style={{ margin: '2px 0' }}>العميل: {lastOrder.customerName}</p>
                                    <p style={{ margin: '2px 0' }}>تليفون: {lastOrder.customerPhone}</p>
                                    <p style={{ margin: '2px 0' }}>العنوان: {lastOrder.customerAddress}</p>
                                    {lastOrder.driverName && <p style={{ margin: '2px 0' }}>الطيار: {lastOrder.driverName}</p>}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div style={{ marginBottom: '15px' }}>
                            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #000' }}>
                                        <th style={{ textAlign: 'right', padding: '5px 0' }}>الصنف</th>
                                        <th style={{ textAlign: 'center', width: '30px' }}>عدد</th>
                                        <th style={{ textAlign: 'center', width: '50px' }}>سعر</th>
                                        <th style={{ textAlign: 'left', width: '50px' }}>إجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lastOrder.items.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px dashed #ccc' }}>
                                            <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 'bold' }}>
                                                {item.name}
                                                {item.variantId && <div style={{ fontSize: '11px', fontWeight: 'normal' }}>{item.product?.variants?.find(v => v.id === item.variantId)?.name}</div>}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'center' }}>{item.price}</td>
                                            <td style={{ textAlign: 'left' }}>{item.quantity * item.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div style={{ borderTop: '2px solid #000', paddingTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginBottom: '5px' }}>
                                <span>الإجمالي:</span>
                                <span style={{ fontWeight: 'bold' }}>{formatCurrency(lastOrder.total - (parseFloat(lastOrder.deliveryFee) || 0))}</span>
                            </div>

                            {parseFloat(lastOrder.deliveryFee) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                                    <span>خدمة التوصيل:</span>
                                    <span>{formatCurrency(lastOrder.deliveryFee)}</span>
                                </div>
                            )}

                            {/* Final Total */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', margin: '10px 0' }}>
                                <span>المطلوب:</span>
                                <span>{formatCurrency(lastOrder.total)}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span>المدفوع:</span>
                                <span>{formatCurrency(lastOrder.paid)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span>الباقي:</span>
                                <span>{formatCurrency(lastOrder.change)}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                            <p style={{ margin: '5px 0' }}>شكراً لزيارتكم!</p>
                            <p style={{ margin: '0', fontSize: '12px' }}>نعتز بخدمتكم</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
