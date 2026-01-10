import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserPlus,
    Clock,
    AlertCircle,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { superAdminService } from '../../services/superadmin.service';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await superAdminService.getDashboard();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'إجمالي المشتركين',
            value: stats?.totalTenants || 0,
            icon: Users,
            color: '#3b82f6',
            bg: 'rgba(59, 130, 246, 0.1)'
        },
        {
            label: 'مشتركين نشطين',
            value: stats?.activeTenants || 0,
            icon: TrendingUp,
            color: '#22c55e',
            bg: 'rgba(34, 197, 94, 0.1)'
        },
        {
            label: 'فترة تجريبية',
            value: stats?.trialTenants || 0,
            icon: Clock,
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.1)'
        },
        {
            label: 'ينتهي قريباً',
            value: stats?.expiringSoon || 0,
            icon: AlertCircle,
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.1)'
        },
    ];

    const getStatusLabel = (status) => {
        const labels = {
            TRIAL: 'تجريبي',
            ACTIVE: 'نشط',
            SUSPENDED: 'موقوف',
            EXPIRED: 'منتهي',
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            TRIAL: '#f59e0b',
            ACTIVE: '#22c55e',
            SUSPENDED: '#ef4444',
            EXPIRED: '#6b7280',
        };
        return colors[status] || '#6b7280';
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">لوحة التحكم</h1>
                    <p className="page-subtitle">مرحباً بك في لوحة تحكم Super Admin</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/superadmin/tenants')}
                    style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}
                >
                    <UserPlus size={18} />
                    إضافة مشترك
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {statCards.map((stat, index) => (
                    <div key={index} className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 8 }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>
                                    {stat.value}
                                </p>
                            </div>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: stat.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <stat.icon size={24} color={stat.color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Tenants */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <Calendar size={20} />
                        آخر المشتركين
                    </h3>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>البريد</th>
                                <th>الحالة</th>
                                <th>تاريخ التسجيل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentTenants?.length > 0 ? (
                                stats.recentTenants.map((tenant) => (
                                    <tr key={tenant.id}>
                                        <td style={{ fontWeight: 500 }}>{tenant.name}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{tenant.email}</td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${getStatusColor(tenant.status)}20`,
                                                    color: getStatusColor(tenant.status)
                                                }}
                                            >
                                                {getStatusLabel(tenant.status)}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {new Date(tenant.createdAt).toLocaleDateString('ar-EG')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: 32 }}>
                                        لا يوجد مشتركين بعد
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
