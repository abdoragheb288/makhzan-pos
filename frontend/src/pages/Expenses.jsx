import { useState, useEffect } from 'react';
import { Plus, DollarSign, Trash2, Edit2, Calendar, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { expenseService, branchService } from '../services';
import { formatCurrency, formatDateTime } from '../utils/helpers';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [summary, setSummary] = useState({ total: 0, byCategory: {} });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        branchId: '',
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchExpenses();
        fetchBranches();
        fetchCategories();
        fetchSummary();
    }, []);

    const fetchExpenses = async () => {
        try {
            const response = await expenseService.getAll({ limit: 50 });
            if (response.success) setExpenses(response.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchBranches = async () => {
        try {
            const response = await branchService.getAll({ limit: 100 });
            if (response.success) setBranches(response.data);
        } catch (error) { console.error(error); }
    };

    const fetchCategories = async () => {
        try {
            const response = await expenseService.getCategories();
            if (response.success) setCategories(response.data);
        } catch (error) { console.error(error); }
    };

    const fetchSummary = async () => {
        try {
            const response = await expenseService.getSummary({});
            if (response.success) setSummary(response.data);
        } catch (error) { console.error(error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await expenseService.update(editingId, formData);
                toast.success('تم تحديث المصروف');
            } else {
                await expenseService.create(formData);
                toast.success('تم إضافة المصروف');
            }
            setShowModal(false);
            resetForm();
            fetchExpenses();
            fetchSummary();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleEdit = (expense) => {
        setEditingId(expense.id);
        setFormData({
            branchId: expense.branchId,
            category: expense.category,
            description: expense.description || '',
            amount: expense.amount,
            date: new Date(expense.date).toISOString().split('T')[0],
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
        try {
            await expenseService.delete(id);
            toast.success('تم حذف المصروف');
            fetchExpenses();
            fetchSummary();
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({ branchId: '', category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
        setEditingId(null);
    };

    // Get top 3 categories
    const topCategories = Object.entries(summary.byCategory || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>المصروفات</h1>
                    <p>إدارة مصروفات الفروع</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowModal(true); resetForm(); }}>
                    <Plus size={18} />
                    إضافة مصروف
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card" style={{ gridColumn: 'span 1' }}>
                    <div className="stat-icon stat-icon-danger"><TrendingDown size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{formatCurrency(summary.total)}</div>
                        <div className="stat-label">إجمالي المصروفات</div>
                    </div>
                </div>
                {topCategories.map(([cat, amount]) => (
                    <div key={cat} className="stat-card">
                        <div className="stat-icon stat-icon-warning"><DollarSign size={24} /></div>
                        <div className="stat-content">
                            <div className="stat-value">{formatCurrency(amount)}</div>
                            <div className="stat-label">{cat}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div>
                    ) : expenses.length === 0 ? (
                        <div className="empty-state">
                            <DollarSign size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد مصروفات</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>التصنيف</th>
                                    <th>الوصف</th>
                                    <th>الفرع</th>
                                    <th>المبلغ</th>
                                    <th>التاريخ</th>
                                    <th>بواسطة</th>
                                    <th width={100}>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td><span className="badge badge-danger">{expense.category}</span></td>
                                        <td>{expense.description || '-'}</td>
                                        <td>{expense.branch?.name}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--color-danger-600)' }}>{formatCurrency(expense.amount)}</td>
                                        <td>{new Date(expense.date).toLocaleDateString('ar-EG')}</td>
                                        <td>{expense.user?.name}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(expense)}><Edit2 size={16} /></button>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger-500)' }} onClick={() => handleDelete(expense.id)}><Trash2 size={16} /></button>
                                            </div>
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
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingId ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">الفرع</label>
                                    <select className="form-input" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} required>
                                        <option value="">اختر الفرع</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">التصنيف</label>
                                    <select className="form-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                                        <option value="">اختر التصنيف</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الوصف</label>
                                    <input type="text" className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="تفاصيل المصروف (اختياري)" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">المبلغ</label>
                                        <input type="number" className="form-input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required min="0" step="0.01" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">التاريخ</label>
                                        <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary">{editingId ? 'تحديث' : 'إضافة'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
