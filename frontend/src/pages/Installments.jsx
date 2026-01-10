import { useState, useEffect } from 'react';
import { Plus, CreditCard, AlertCircle, DollarSign, Calendar, Phone, User, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { installmentService, branchService, saleService } from '../services';
import { formatCurrency, formatDateTime } from '../utils/helpers';

export default function Installments() {
    const [installments, setInstallments] = useState([]);
    const [overdueList, setOverdueList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [selectedInstallment, setSelectedInstallment] = useState(null);
    const [formData, setFormData] = useState({
        saleId: '',
        branchId: '',
        customerName: '',
        customerPhone: '',
        totalAmount: '',
        downPayment: '',
        numberOfPayments: '3',
        notes: '',
    });
    const [paymentAmount, setPaymentAmount] = useState('');

    useEffect(() => {
        fetchInstallments();
        fetchOverdue();
    }, []);

    const fetchInstallments = async () => {
        try {
            const response = await installmentService.getAll({ limit: 50 });
            if (response.success) setInstallments(response.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchOverdue = async () => {
        try {
            const response = await installmentService.getOverdue();
            if (response.success) setOverdueList(response.data);
        } catch (error) { console.error(error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await installmentService.create(formData);
            toast.success('تم إنشاء خطة التقسيط بنجاح');
            setShowModal(false);
            resetForm();
            fetchInstallments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!selectedInstallment) return;
        try {
            await installmentService.addPayment(selectedInstallment.id, {
                amount: parseFloat(paymentAmount),
                paymentMethod: 'CASH',
            });
            toast.success('تم تسجيل الدفعة بنجاح');
            setShowPaymentModal(false);
            setPaymentAmount('');
            fetchInstallments();
            fetchOverdue();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const openPaymentModal = (inst) => {
        setSelectedInstallment(inst);
        setPaymentAmount(inst.paymentPerMonth?.toString() || '');
        setShowPaymentModal(true);
    };

    const resetForm = () => {
        setFormData({
            saleId: '', branchId: '', customerName: '', customerPhone: '',
            totalAmount: '', downPayment: '', numberOfPayments: '3', notes: '',
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            ACTIVE: { color: 'primary', label: 'نشط' },
            COMPLETED: { color: 'success', label: 'مكتمل' },
            OVERDUE: { color: 'danger', label: 'متأخر' },
            CANCELLED: { color: 'gray', label: 'ملغي' },
        };
        const b = badges[status] || badges.ACTIVE;
        return <span className={`badge badge-${b.color}`}>{b.label}</span>;
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>التقسيط</h1>
                    <p>إدارة مبيعات التقسيط</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowModal(true); resetForm(); }}>
                    <Plus size={18} />
                    تقسيط جديد
                </button>
            </div>

            {/* Overdue Alert */}
            {overdueList.length > 0 && (
                <div style={{ background: 'var(--color-danger-50)', border: '1px solid var(--color-danger-500)', borderRadius: 'var(--border-radius)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <AlertCircle size={24} color="var(--color-danger-600)" />
                    <span style={{ color: 'var(--color-danger-600)', fontWeight: 500 }}>
                        يوجد {overdueList.length} أقساط متأخرة السداد!
                    </span>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><CreditCard size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{installments.filter(i => i.status === 'ACTIVE').length}</div>
                        <div className="stat-label">أقساط نشطة</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-danger"><AlertCircle size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{overdueList.length}</div>
                        <div className="stat-label">متأخرة السداد</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><DollarSign size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{formatCurrency(installments.reduce((sum, i) => sum + parseFloat(i.remainingAmount || 0), 0))}</div>
                        <div className="stat-label">إجمالي المستحق</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><Calendar size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{installments.filter(i => i.status === 'COMPLETED').length}</div>
                        <div className="stat-label">أقساط مكتملة</div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div>
                    ) : installments.length === 0 ? (
                        <div className="empty-state">
                            <CreditCard size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد أقساط</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>العميل</th>
                                    <th>رقم الفاتورة</th>
                                    <th>المبلغ الكلي</th>
                                    <th>المتبقي</th>
                                    <th>القسط الشهري</th>
                                    <th>موعد الدفع</th>
                                    <th>الحالة</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {installments.map((inst) => (
                                    <>
                                        <tr key={inst.id}>
                                            <td>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(expandedId === inst.id ? null : inst.id)}>
                                                    {expandedId === inst.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{inst.customerName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    <Phone size={12} style={{ display: 'inline', marginLeft: 4 }} />
                                                    {inst.customerPhone}
                                                </div>
                                            </td>
                                            <td>{inst.sale?.invoiceNumber || '-'}</td>
                                            <td style={{ fontWeight: 600 }}>{formatCurrency(inst.totalAmount)}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--color-warning-600)' }}>{formatCurrency(inst.remainingAmount)}</td>
                                            <td>{formatCurrency(inst.paymentPerMonth)}</td>
                                            <td style={{ fontSize: '0.875rem' }}>{new Date(inst.nextDueDate).toLocaleDateString('ar-EG')}</td>
                                            <td>{getStatusBadge(inst.status)}</td>
                                            <td>
                                                {inst.status === 'ACTIVE' && (
                                                    <button className="btn btn-success btn-sm" onClick={() => openPaymentModal(inst)}>
                                                        <DollarSign size={14} /> سداد
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedId === inst.id && (
                                            <tr>
                                                <td colSpan={9} style={{ background: 'var(--bg-tertiary)', padding: 'var(--spacing-md)' }}>
                                                    <strong>الدفعات ({inst._count?.payments || 0}):</strong>
                                                    <div style={{ marginTop: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                        المقدم: {formatCurrency(inst.downPayment)} |
                                                        عدد الأقساط: {inst.numberOfPayments} |
                                                        بداية: {new Date(inst.startDate).toLocaleDateString('ar-EG')}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">إنشاء خطة تقسيط</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">اسم العميل</label>
                                        <input type="text" className="form-input" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">رقم الهاتف</label>
                                        <input type="tel" className="form-input" value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">المبلغ الإجمالي</label>
                                        <input type="number" className="form-input" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} required min="0" step="0.01" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">المقدم</label>
                                        <input type="number" className="form-input" value={formData.downPayment} onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })} required min="0" step="0.01" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد الأقساط</label>
                                    <select className="form-input" value={formData.numberOfPayments} onChange={(e) => setFormData({ ...formData, numberOfPayments: e.target.value })} required>
                                        <option value="2">2 أقساط</option>
                                        <option value="3">3 أقساط</option>
                                        <option value="4">4 أقساط</option>
                                        <option value="6">6 أقساط</option>
                                        <option value="12">12 قسط</option>
                                    </select>
                                </div>
                                {formData.totalAmount && formData.downPayment && (
                                    <div style={{ background: 'var(--color-primary-50)', padding: 'var(--spacing-md)', borderRadius: 8 }}>
                                        <strong>القسط الشهري: </strong>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-600)' }}>
                                            {formatCurrency((parseFloat(formData.totalAmount) - parseFloat(formData.downPayment)) / parseInt(formData.numberOfPayments))}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary">إنشاء التقسيط</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedInstallment && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">تسجيل دفعة</h3>
                            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handlePayment}>
                            <div className="modal-body">
                                <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--spacing-md)', borderRadius: 8, marginBottom: 'var(--spacing-md)' }}>
                                    <p><strong>العميل:</strong> {selectedInstallment.customerName}</p>
                                    <p><strong>المتبقي:</strong> {formatCurrency(selectedInstallment.remainingAmount)}</p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">مبلغ الدفعة</label>
                                    <input type="number" className="form-input" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required min="0.01" max={selectedInstallment.remainingAmount} step="0.01" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-success">تسجيل الدفعة</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
