import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Warehouse,
    GitBranch,
    ArrowLeftRight,
    Users,
    Truck,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    ChevronDown,
    RotateCcw,
    DollarSign,
    Clock,
    Tag,
} from 'lucide-react';
import { useAuthStore } from '../store';
import { getInitials, getRoleLabel } from '../utils/helpers';

const navItems = [
    {
        section: 'الرئيسية',
        items: [
            { path: '/', icon: LayoutDashboard, label: 'لوحة التحكم', permission: 'admin' },
            { path: '/pos', icon: ShoppingCart, label: 'نقطة البيع', permission: 'pos' },
        ],
    },
    {
        section: 'المنتجات',
        items: [
            { path: '/products', icon: Package, label: 'المنتجات', permission: 'products' },
            { path: '/categories', icon: GitBranch, label: 'التصنيفات', permission: 'products' },
        ],
    },
    {
        section: 'المخزون',
        items: [
            { path: '/inventory', icon: Warehouse, label: 'المخزون', permission: 'inventory' },
            { path: '/transfers', icon: ArrowLeftRight, label: 'نقل البضائع', permission: 'transfers' },
            { path: '/branches', icon: GitBranch, label: 'الفروع', permission: 'settings' },
        ],
    },
    {
        section: 'المشتريات',
        items: [
            { path: '/suppliers', icon: Truck, label: 'الموردين', permission: 'inventory' },
            { path: '/purchases', icon: FileText, label: 'أوامر الشراء', permission: 'inventory' },
        ],
    },
    {
        section: 'المبيعات',
        items: [
            { path: '/sales', icon: FileText, label: 'الفواتير', permission: 'reports' },
            { path: '/returns', icon: RotateCcw, label: 'المرتجعات', permission: 'reports' },
            { path: '/discounts', icon: Tag, label: 'الخصومات', permission: 'settings' },
            { path: '/installments', icon: Clock, label: 'التقسيط', permission: 'reports' },
            { path: '/preorders', icon: Clock, label: 'الحجوزات', permission: 'inventory' },
        ],
    },
    {
        section: 'المالية',
        items: [
            { path: '/expenses', icon: DollarSign, label: 'المصروفات', permission: 'reports' },
            { path: '/shifts', icon: Clock, label: 'الورديات', permission: 'admin' },
        ],
    },
    {
        section: 'التقارير و الإعدادات',
        items: [
            { path: '/reports', icon: BarChart3, label: 'التقارير', permission: 'reports' },
            { path: '/analytics', icon: BarChart3, label: 'التحليلات', permission: 'reports' },
            { path: '/users', icon: Users, label: 'المستخدمين', permission: 'users' },
            { path: '/settings', icon: Settings, label: 'الإعدادات', permission: 'settings' },
        ],
    },
];

export default function Sidebar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const hasPermission = (requiredPerm) => {
        if (!requiredPerm) return true;
        if (user?.role === 'ADMIN') return true;
        return user?.permissions?.includes(requiredPerm);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">م</div>
                <span className="sidebar-brand">مخزن POS</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => {
                    const filteredItems = section.items.filter(item => hasPermission(item.permission));

                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={section.section} className="nav-section">
                            <div className="nav-section-title">{section.section}</div>
                            {filteredItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                    end={item.path === '/'}
                                >
                                    <item.icon className="nav-icon" size={20} />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user" onClick={handleLogout}>
                    <div className="avatar">
                        {getInitials(user?.name || 'مستخدم')}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name || 'مستخدم'}</div>
                        <div className="sidebar-user-role">{getRoleLabel(user?.role)}</div>
                    </div>
                    <LogOut size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
            </div>
        </aside>
    );
}
