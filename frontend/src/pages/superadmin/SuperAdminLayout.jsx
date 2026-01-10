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
        const token = localStorage.getItem('superAdminToken');
        const admin = localStorage.getItem('superAdmin');

        if (!token || !admin) {
            navigate('/superadmin/login');
            return;
        }

        setSuperAdmin(JSON.parse(admin));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdmin');
        navigate('/superadmin/login');
    };

    const navItems = [
        { path: '/superadmin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
        { path: '/superadmin/tenants', icon: Users, label: 'المشتركين' },
        { path: '/superadmin/subscriptions', icon: CreditCard, label: 'الاشتراكات' },
    ];

    return (
        <div className="layout" style={{ '--primary': '#e94560', '--primary-dark': '#0f3460' }}>
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`} style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon" style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}>
                            <Shield size={20} />
                        </div>
                        <span>Super Admin</span>
                    </div>
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
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
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar" style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}>
                            {superAdmin?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{superAdmin?.name || 'Super Admin'}</span>
                            <span className="sidebar-user-role">مسؤول النظام</span>
                        </div>
                    </div>
                    <button className="sidebar-logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>خروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
