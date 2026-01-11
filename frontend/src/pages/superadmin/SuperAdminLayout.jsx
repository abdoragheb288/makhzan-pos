import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    LogOut,
    Shield,
    Menu,
    X
} from 'lucide-react';

export default function SuperAdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [superAdmin, setSuperAdmin] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem('superAdminToken');
        const admin = sessionStorage.getItem('superAdmin');

        if (!token || !admin) {
            navigate('/superadmin/login');
            return;
        }

        setSuperAdmin(JSON.parse(admin));
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('superAdminToken');
        sessionStorage.removeItem('superAdmin');
        navigate('/superadmin/login');
    };

    const navItems = [
        { path: '/superadmin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
        { path: '/superadmin/tenants', icon: Users, label: 'المشتركين' },
        { path: '/superadmin/subscriptions', icon: CreditCard, label: 'الاشتراكات' },
    ];

    return (
        <div className="app-layout" style={{ '--primary': '#e94560', '--primary-dark': '#0f3460' }}>
            {/* Sidebar */}
            <aside
                className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}
                style={{
                    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <div className="sidebar-header" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}>
                            <Shield size={20} />
                        </div>
                        <span style={{ color: 'white' }}>Super Admin</span>
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                            style={({ isActive }) => ({
                                color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                                background: isActive ? 'rgba(233, 69, 96, 0.15)' : 'transparent',
                                borderRight: isActive ? '3px solid #e94560' : '3px solid transparent',
                            })}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="sidebar-user" style={{ color: 'white' }}>
                        <div className="sidebar-user-avatar" style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}>
                            {superAdmin?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name" style={{ color: 'white' }}>{superAdmin?.name || 'Super Admin'}</span>
                            <span className="sidebar-user-role" style={{ color: 'rgba(255,255,255,0.5)' }}>مسؤول النظام</span>
                        </div>
                    </div>
                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                        style={{
                            marginTop: 12,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <LogOut size={18} />
                        <span>تسجيل خروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content" style={{ background: '#f8f9fa' }}>
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
