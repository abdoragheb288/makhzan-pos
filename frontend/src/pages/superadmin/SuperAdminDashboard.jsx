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
        <div className="page" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: 32 }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>لوحة التحكم</h1>
                    <p className="page-subtitle" style={{ color: '#666' }}>مرحباً بك في لوحة تحكم Super Admin</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/superadmin/tenants')}
                    style={{
                        background: 'linear-gradient(135deg, #e94560, #0f3460)',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: 12,
                        boxShadow: '0 4px 15px rgba(233, 69, 96, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'white',
                        fontWeight: 600
                    }}
                >
                    <UserPlus size={18} />
                    إضافة مشترك
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 24,
                marginBottom: 32
            }}>
                {statCards.map((stat, index) => (
                    <div key={index} className="card" style={{
                        padding: 24,
                        borderRadius: 16,
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                        background: 'white',
                        transition: 'transform 0.2s',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>
                                    {stat.value}
                                </p>
                            </div>
                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: 16,
                                background: stat.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <stat.icon size={28} color={stat.color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Tenants */}
            <div className="card" style={{
                borderRadius: 16,
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                background: 'white',
                overflow: 'hidden'
            }}>
                <div className="card-header" style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <div style={{
                        padding: 10,
                        background: 'rgba(233, 69, 96, 0.1)',
                        borderRadius: 10,
                        color: '#e94560'
                    }}>
                        <Calendar size={20} />
                    </div>
                    <h3 className="card-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                        آخر المشتركين
                    </h3>
                </div>
                <div className="table-container" style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '16px 32px', textAlign: 'right', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>الاسم</th>
                                <th style={{ padding: '16px 32px', textAlign: 'right', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>البريد</th>
                                <th style={{ padding: '16px 32px', textAlign: 'right', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>الحالة</th>
                                <th style={{ padding: '16px 32px', textAlign: 'right', color: '#6b7280', fontWeight: 600, fontSize: '0.875rem' }}>تاريخ التسجيل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentTenants?.length > 0 ? (
                                stats.recentTenants.map((tenant) => (
                                    <tr key={tenant.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '20px 32px', fontWeight: 600, color: '#1a1a2e' }}>{tenant.name}</td>
                                        <td style={{ padding: '20px 32px', color: '#6b7280' }}>{tenant.email}</td>
                                        <td style={{ padding: '20px 32px' }}>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${getStatusColor(tenant.status)}15`,
                                                    color: getStatusColor(tenant.status),
                                                    padding: '6px 12px',
                                                    borderRadius: 20,
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    border: `1px solid ${getStatusColor(tenant.status)}30`
                                                }}
                                            >
                                                {getStatusLabel(tenant.status)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 32px', color: '#6b7280' }}>
                                            {new Date(tenant.createdAt).toLocaleDateString('ar-EG')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
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
