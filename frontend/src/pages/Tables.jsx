/**
 * Tables Page
 * Restaurant/Cafe table management
 * Only visible for business types with 'tables' feature enabled
 */

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store';

const TABLE_STATUSES = {
    available: { label: 'متاحة', color: 'badge-success' },
    occupied: { label: 'مشغولة', color: 'badge-warning' },
    reserved: { label: 'محجوزة', color: 'badge-primary' },
};

export default function Tables() {
    const { user } = useAuthStore();
    const [tables, setTables] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        branchId: '',
        capacity: 4,
        position: 0,
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranch || branches.length > 0) {
            fetchTables();
        }
    }, [selectedBranch, branches]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches?limit=100');
            if (response.data.success) {
                setBranches(response.data.data);
                if (response.data.data.length > 0 && !selectedBranch) {
                    setSelectedBranch(response.data.data[0].id.toString());
                }
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchTables = async () => {
        try {
            setLoading(true);
            const params = selectedBranch ? `?branchId=${selectedBranch}&limit=100` : '?limit=100';
            const response = await api.get(`/tables${params}`);
            if (response.data.success) {
                setTables(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
            toast.error('خطأ في جلب الطاولات');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTable) {
                await api.put(`/tables/${editingTable.id}`, formData);
                toast.success('تم تحديث الطاولة');
            } else {
                await api.post('/tables', formData);
                toast.success('تم إضافة الطاولة');
            }
            setShowModal(false);
            resetForm();
            fetchTables();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const resetForm = () => {
        setEditingTable(null);
        setFormData({
            name: '',
            branchId: selectedBranch || '',
            capacity: 4,
            position: 0,
        });
    };

    const handleEdit = (table) => {
        setEditingTable(table);
        setFormData({
            name: table.name,
            branchId: table.branchId.toString(),
            capacity: table.capacity,
            position: table.position,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذه الطاولة؟')) return;
        try {
            await api.delete(`/tables/${id}`);
            toast.success('تم حذف الطاولة');
            fetchTables();
        } catch (error) {
            toast.error(error.response?.data?.message || 'حدث خطأ أثناء الحذف');
        }
    };

    const handleStatusChange = async (tableId, newStatus) => {
        try {
            await api.patch(`/tables/${tableId}/status`, { status: newStatus });
            fetchTables();
            toast.success('تم تحديث حالة الطاولة');
        } catch (error) {
            toast.error('خطأ في تحديث الحالة');
        }
    };

    const getStatusBadge = (status) => {
        const config = TABLE_STATUSES[status] || TABLE_STATUSES.available;
        return <span className={`badge ${config.color}`}>{config.label}</span>;
    };

    // Calculate stats
    const stats = {
        total: tables.length,
        available: tables.filter(t => t.status === 'available').length,
        occupied: tables.filter(t => t.status === 'occupied').length,
        reserved: tables.filter(t => t.status === 'reserved').length,
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>الطاولات</h1>
                    <p>إدارة طاولات المطعم والكافيه</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={18} />
                    إضافة طاولة
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">إجمالي الطاولات</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value" style={{ color: 'var(--color-success-500)' }}>{stats.available}</div>
                        <div className="stat-label">متاحة</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value" style={{ color: 'var(--color-warning-500)' }}>{stats.occupied}</div>
                        <div className="stat-label">مشغولة</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value" style={{ color: 'var(--color-primary-500)' }}>{stats.reserved}</div>
                        <div className="stat-label">محجوزة</div>
                    </div>
                </div>
            </div>

            {/* Branch Filter */}
            {branches.length > 1 && (
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        style={{ width: '200px' }}
                    >
                        <option value="">كل الفروع</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Tables Grid */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="loading-state">جاري التحميل...</div>
                    ) : tables.length === 0 ? (
                        <div className="empty-state">
                            <AlertCircle size={48} />
                            <p>لا توجد طاولات</p>
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                إضافة طاولة جديدة
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4" style={{ gap: 'var(--spacing-md)' }}>
                            {tables.map((table) => (
                                <div
                                    key={table.id}
                                    className="card"
                                    style={{
                                        borderColor: table.status === 'occupied'
                                            ? 'var(--color-warning-500)'
                                            : table.status === 'reserved'
                                                ? 'var(--color-primary-500)'
                                                : 'var(--color-success-500)',
                                        borderWidth: '2px',
                                    }}
                                >
                                    <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                            <h3 style={{ margin: 0 }}>{table.name}</h3>
                                            {getStatusBadge(table.status)}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                            <Users size={16} />
                                            <span>{table.capacity} أشخاص</span>
                                        </div>

                                        {table.hasActiveOrder && (
                                            <div style={{ marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-xs)', background: 'var(--color-warning-50)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                    <Clock size={14} />
                                                    <span>طلب نشط: {table.activeOrder?.orderNumber}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-md)' }}>
                                            <select
                                                value={table.status}
                                                onChange={(e) => handleStatusChange(table.id, e.target.value)}
                                                style={{ flex: 1, fontSize: '0.85rem' }}
                                            >
                                                <option value="available">متاحة</option>
                                                <option value="occupied">مشغولة</option>
                                                <option value="reserved">محجوزة</option>
                                            </select>
                                            <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(table)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleDelete(table.id)}
                                                disabled={table.hasActiveOrder}
                                                style={{ color: 'var(--color-danger-500)' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingTable ? 'تعديل الطاولة' : 'إضافة طاولة جديدة'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">اسم الطاولة</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="مثال: طاولة 1، T-05"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الفرع</label>
                                    <select
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
                                <div className="form-group">
                                    <label className="form-label">السعة (عدد الأشخاص)</label>
                                    <input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 4 })}
                                        min="1"
                                        max="20"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الترتيب</label>
                                    <input
                                        type="number"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                    <div className="form-hint">رقم أقل = يظهر أولاً</div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="btn btn-primary">{editingTable ? 'تحديث' : 'إضافة'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
