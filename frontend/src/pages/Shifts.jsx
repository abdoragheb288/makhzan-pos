import { useState, useEffect } from 'react';
import { Clock, Users, Building2, Search, AlertTriangle, CheckCircle, Filter } from 'lucide-react';
import { shiftService, branchService, userService } from '../services';
import { formatCurrency, formatDateTime } from '../utils/helpers';

export default function Shifts() {
    const [shifts, setShifts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        branchId: '',
        userId: '',
        status: '', // open, closed
    });
    const [stats, setStats] = useState({ open: 0, closed: 0, withDiff: 0 });

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, shifts]);

    const fetchAll = async () => {
        try {
            const [shiftsRes, branchRes, usersRes] = await Promise.all([
                shiftService.getAll({ limit: 100 }),
                branchService.getAll({ limit: 100 }),
                userService.getAll({ limit: 100 }),
            ]);
            if (shiftsRes.success) {
                setShifts(shiftsRes.data);
                calculateStats(shiftsRes.data);
            }
            if (branchRes.success) setBranches(branchRes.data);
            if (usersRes.success) setUsers(usersRes.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const calculateStats = (data) => {
        setStats({
            open: data.filter(s => !s.closedAt).length,
            closed: data.filter(s => s.closedAt).length,
            withDiff: data.filter(s => s.closedAt && parseFloat(s.difference) !== 0).length,
        });
    };

    const applyFilters = () => {
        // Filtering is done at render time
    };

    const getFilteredShifts = () => {
        return shifts.filter(s => {
            if (filters.branchId && s.branchId !== parseInt(filters.branchId)) return false;
            if (filters.userId && s.userId !== parseInt(filters.userId)) return false;
            if (filters.status === 'open' && s.closedAt) return false;
            if (filters.status === 'closed' && !s.closedAt) return false;
            return true;
        });
    };

    const getDuration = (shift) => {
        if (!shift.openedAt) return '-';
        const start = new Date(shift.openedAt);
        const end = shift.closedAt ? new Date(shift.closedAt) : new Date();
        const diff = Math.floor((end - start) / 1000 / 60);
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${hours}س ${mins}د`;
    };

    const filteredShifts = getFilteredShifts();

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-header-info">
                    <h1>📋 سجل الورديات</h1>
                    <p>عرض جميع ورديات الموظفين (للمشرف فقط)</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-success"><CheckCircle size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.open}</div>
                        <div className="stat-label">ورديات مفتوحة الآن</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-primary"><Clock size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.closed}</div>
                        <div className="stat-label">ورديات مغلقة</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-warning"><AlertTriangle size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.withDiff}</div>
                        <div className="stat-label">بها فروقات</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-gray"><Users size={24} /></div>
                    <div className="stat-content">
                        <div className="stat-value">{shifts.length}</div>
                        <div className="stat-label">إجمالي الورديات</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Filter size={20} color="var(--text-muted)" />
                        <select
                            className="form-input"
                            style={{ width: 180 }}
                            value={filters.branchId}
                            onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
                        >
                            <option value="">كل الفروع</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <select
                            className="form-input"
                            style={{ width: 180 }}
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                        >
                            <option value="">كل الموظفين</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <select
                            className="form-input"
                            style={{ width: 150 }}
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">كل الحالات</option>
                            <option value="open">مفتوحة</option>
                            <option value="closed">مغلقة</option>
                        </select>
                        {(filters.branchId || filters.userId || filters.status) && (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setFilters({ branchId: '', userId: '', status: '' })}
                            >
                                مسح الفلاتر
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">سجل الورديات ({filteredShifts.length})</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="loading-spinner" /></div>
                    ) : filteredShifts.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={60} className="empty-state-icon" />
                            <div className="empty-state-title">لا توجد ورديات</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>الموظف</th>
                                    <th>الفرع</th>
                                    <th>بداية الوردية</th>
                                    <th>نهاية الوردية</th>
                                    <th>المدة</th>
                                    <th>رصيد الافتتاح</th>
                                    <th>المتوقع</th>
                                    <th>الفعلي</th>
                                    <th>الفارق</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredShifts.map((shift) => (
                                    <tr key={shift.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{shift.user?.name || '-'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{shift.user?.email}</div>
                                        </td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Building2 size={14} color="var(--text-muted)" />
                                                {shift.branch?.name || '-'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.875rem' }}>{formatDateTime(shift.openedAt)}</td>
                                        <td style={{ fontSize: '0.875rem' }}>{shift.closedAt ? formatDateTime(shift.closedAt) : '-'}</td>
                                        <td style={{ fontWeight: 500 }}>{getDuration(shift)}</td>
                                        <td>{formatCurrency(shift.openingBalance)}</td>
                                        <td>{shift.expectedCash ? formatCurrency(shift.expectedCash) : '-'}</td>
                                        <td>{shift.actualCash ? formatCurrency(shift.actualCash) : '-'}</td>
                                        <td>
                                            {shift.difference !== null && shift.difference !== undefined ? (
                                                <span style={{
                                                    fontWeight: 700,
                                                    color: parseFloat(shift.difference) > 0 ? 'var(--color-success-600)' :
                                                        parseFloat(shift.difference) < 0 ? 'var(--color-danger-600)' : 'inherit'
                                                }}>
                                                    {parseFloat(shift.difference) > 0 ? '+' : ''}{formatCurrency(shift.difference)}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <span className={`badge ${shift.closedAt ? 'badge-gray' : 'badge-success'}`}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                                                <div style={{
                                                    width: 6, height: 6,
                                                    borderRadius: '50%',
                                                    background: shift.closedAt ? 'var(--text-muted)' : '#22c55e',
                                                }} />
                                                {shift.closedAt ? 'مغلقة' : 'مفتوحة'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
