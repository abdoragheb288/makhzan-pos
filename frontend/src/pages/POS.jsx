import { useEffect, useState, useRef } from 'react';
import {
    Search,
    Barcode,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    Clock,
    Check,
    Loader2,
    Package,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { posService } from '../services';
import { usePosStore } from '../store';
import { formatCurrency, formatNumber } from '../utils/helpers';
import ShiftWidget from '../components/ShiftWidget';
import '../styles/pos.css';

export default function POS() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
    const searchRef = useRef(null);
    const barcodeRef = useRef(null);

    const {
        cart,
        selectedCategory,
        discount,
        discountType,
        paymentMethod,
        paidAmount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        setDiscount,
        setPaymentMethod,
        setPaidAmount,
        setSelectedCategory,
        getSubtotal,
        getDiscountAmount,
        getTotal,
        getChange,
    } = usePosStore();

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [selectedCategory]);

    const fetchProducts = async () => {
        try {
            const response = await posService.getProducts({
                search: searchQuery,
                categoryId: selectedCategory,
            });
            if (response.success) {
                setProducts(response.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await posService.getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    const handleBarcodeSearch = async (e) => {
        if (e.key === 'Enter' && e.target.value) {
            try {
                const response = await posService.searchByBarcode(e.target.value);
                if (response.success && response.data) {
                    addToCart(response.data);
                    toast.success('تمت الإضافة للسلة');
                    e.target.value = '';
                }
            } catch (error) {
                toast.error('المنتج غير موجود');
            }
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('السلة فارغة');
            return;
        }

        const total = getTotal();
        const paid = parseFloat(paidAmount) || 0;

        if (paymentMethod === 'CASH' && paid < total) {
            toast.error('المبلغ المدفوع أقل من الإجمالي');
            return;
        }

        setSubmitting(true);
        try {
            const response = await posService.createSale({
                items: cart.map((item) => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    discount: item.discount,
                })),
                discount,
                discountType,
                paymentMethod,
                paid: paymentMethod === 'CASH' ? paid : total,
            });

            if (response.success) {
                toast.success('تم إتمام البيع بنجاح');
                clearCart();
                fetchProducts(); // Refresh stock
            }
        } catch (error) {
            const message = error.response?.data?.message || 'حدث خطأ';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const total = getTotal();
    const change = getChange();

    return (
        <div className="pos-container">
            {/* Products Section */}
            <div className="pos-products">
                {/* Search & Barcode */}
                <div className="pos-search-bar">
                    <div className="search-input" style={{ flex: 1 }}>
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="بحث عن منتج..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                        />
                        <Search className="search-icon" size={18} />
                    </div>
                    <div className="search-input" style={{ width: 200 }}>
                        <input
                            ref={barcodeRef}
                            type="text"
                            placeholder="مسح الباركود"
                            onKeyDown={handleBarcodeSearch}
                        />
                        <Barcode className="search-icon" size={18} />
                    </div>
                    {/* Shift Widget for Employees */}
                    <ShiftWidget />
                </div>

                {/* Categories */}
                <div className="pos-categories">
                    <button
                        className={`pos-category-btn ${!selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        الكل
                    </button>
                    {categories.map((cat) => (
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
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>
                            <div className="loading-spinner" style={{ margin: '0 auto' }} />
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            لا توجد منتجات
                        </div>
                    ) : (
                        products.map((product) => (
                            <div
                                key={product.id}
                                className="pos-product-card"
                                onClick={() => {
                                    if (product.variants.length === 1) {
                                        const variant = product.variants[0];
                                        if (variant.stock > 0) {
                                            addToCart({
                                                ...variant,
                                                productId: product.id,
                                                name: product.name,
                                                image: product.image,
                                            });
                                            toast.success('تمت الإضافة');
                                        } else {
                                            toast.error('نفذت الكمية');
                                        }
                                    } else {
                                        setSelectedProductForVariants(product);
                                    }
                                }}
                            >
                                <div className="pos-product-image">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} />
                                    ) : (
                                        <div className="pos-product-placeholder">
                                            <Package size={32} strokeWidth={1.5} />
                                        </div>
                                    )}
                                    {product.totalStock <= 5 && (
                                        <span className="pos-product-stock-badge">
                                            {product.totalStock}
                                        </span>
                                    )}
                                </div>
                                <div className="pos-product-info">
                                    <div className="pos-product-name">{product.name}</div>
                                    <div className="pos-product-variant">
                                        {product.variants.length > 1
                                            ? `${product.variants.length} خيارات`
                                            : `${product.variants[0]?.size || ''} ${product.variants[0]?.color || ''}`
                                        }
                                    </div>
                                    <div className="pos-product-price">{formatCurrency(product.displayPrice)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Variant Selection Modal */}
            {selectedProductForVariants && (
                <div className="modal-overlay" onClick={() => setSelectedProductForVariants(null)}>
                    <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{selectedProductForVariants.name}</h3>
                            <button className="modal-close" onClick={() => setSelectedProductForVariants(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                                اختر المتغير المناسب لإضافته للسلة:
                            </p>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: 'var(--spacing-md)'
                            }}>
                                {selectedProductForVariants.variants.map((variant) => (
                                    <div
                                        key={variant.variantId}
                                        className={`pos-product-card ${variant.stock === 0 ? 'disabled' : ''}`}
                                        style={{
                                            targetCursor: variant.stock > 0 ? 'pointer' : 'not-allowed',
                                            opacity: variant.stock > 0 ? 1 : 0.6,
                                            border: '1px solid var(--border-color)',
                                            padding: 'var(--spacing-sm)'
                                        }}
                                        onClick={() => {
                                            if (variant.stock > 0) {
                                                addToCart({
                                                    ...variant,
                                                    productId: selectedProductForVariants.id,
                                                    name: selectedProductForVariants.name,
                                                    image: selectedProductForVariants.image,
                                                });
                                                toast.success('تمت الإضافة');
                                                setSelectedProductForVariants(null);
                                            }
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>
                                            {variant.size}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            {variant.color}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            fontSize: '0.85rem',
                                            marginTop: 'auto'
                                        }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--color-primary-600)' }}>
                                                {formatCurrency(variant.price)}
                                            </span>
                                            <span style={{
                                                color: variant.stock > 0 ? 'var(--color-success-600)' : 'var(--color-danger-500)',
                                                fontWeight: '500'
                                            }}>
                                                {variant.stock} {variant.stock > 0 ? 'متبقى' : 'نفذ'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Section */}
            <div className="pos-cart">
                <div className="pos-cart-header">
                    <h3>السلة</h3>
                    {cart.length > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={clearCart}>
                            إفراغ
                        </button>
                    )}
                </div>

                <div className="pos-cart-items">
                    {cart.length === 0 ? (
                        <div className="pos-cart-empty">
                            <ShoppingCartEmpty />
                            <p>السلة فارغة</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.variantId} className="pos-cart-item">
                                <div className="pos-cart-item-info">
                                    <div className="pos-cart-item-name">{item.name}</div>
                                    <div className="pos-cart-item-variant">
                                        {item.size} {item.color && `- ${item.color}`}
                                    </div>
                                    <div className="pos-cart-item-price">{formatCurrency(item.price)}</div>
                                </div>
                                <div className="pos-cart-item-actions">
                                    <div className="pos-quantity-controls">
                                        <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                                            <Minus size={14} />
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <div className="pos-cart-item-total">
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                    <button
                                        className="pos-cart-item-remove"
                                        onClick={() => removeFromCart(item.variantId)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer */}
                <div className="pos-cart-footer">
                    {/* Discount */}
                    <div className="pos-discount-row">
                        <span>الخصم</span>
                        <input
                            type="number"
                            value={discount || ''}
                            onChange={(e) => setDiscount(e.target.value)}
                            placeholder="0"
                            style={{ width: 80, textAlign: 'center' }}
                        />
                        <select
                            value={discountType}
                            onChange={(e) => setDiscount(discount, e.target.value)}
                            style={{ width: 70 }}
                        >
                            <option value="amount">ج.م</option>
                            <option value="percentage">%</option>
                        </select>
                    </div>

                    {/* Totals */}
                    <div className="pos-totals">
                        <div className="pos-total-row">
                            <span>المجموع الفرعي</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="pos-total-row discount">
                                <span>الخصم</span>
                                <span>- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <div className="pos-total-row total">
                            <span>الإجمالي</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="pos-payment-methods">
                        <button
                            className={`pos-payment-btn ${paymentMethod === 'CASH' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('CASH')}
                        >
                            <Banknote size={20} />
                            نقدي
                        </button>
                        <button
                            className={`pos-payment-btn ${paymentMethod === 'CARD' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('CARD')}
                        >
                            <CreditCard size={20} />
                            بطاقة
                        </button>
                        <button
                            className={`pos-payment-btn ${paymentMethod === 'CREDIT' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('CREDIT')}
                        >
                            <Clock size={20} />
                            آجل
                        </button>
                    </div>

                    {/* Paid Amount (for Cash) */}
                    {paymentMethod === 'CASH' && (
                        <div className="pos-paid-section">
                            <div className="form-group" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <label className="form-label">المبلغ المدفوع</label>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    placeholder={formatNumber(total)}
                                />
                            </div>
                            {change > 0 && (
                                <div className="pos-change">
                                    الباقي: <strong>{formatCurrency(change)}</strong>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Checkout Button */}
                    <button
                        className="btn btn-primary btn-lg w-full"
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || submitting}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                جاري المعالجة...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                إتمام البيع
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ShoppingCartEmpty() {
    return (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    );
}
