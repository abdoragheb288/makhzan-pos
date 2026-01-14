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
    UtensilsCrossed,
    ClipboardList,
} from 'lucide-react';
import { useAuthStore, useFeature, useBusinessConfig } from '../store';
import { getInitials, getRoleLabel } from '../utils/helpers';

const navItems = [
    {
        section: 'الرئيسية',
        items: [
            { path: '/', icon: LayoutDashboard, label: 'لوحة التحكم', permission: 'dashboard' },
            { path: '/pos', icon: ShoppingCart, label: 'نقطة البيع', permission: 'pos' },
        ],
    },
    {
        section: 'المطعم',
        feature: 'tables', // Only show for restaurant/cafe
        items: [
            { path: '/tables', icon: UtensilsCrossed, label: 'الطاولات', permission: 'tables', feature: 'tables' },
            { path: '/orders', icon: ClipboardList, label: 'الطلبات', permission: 'orders', feature: 'orders' },
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
            { path: '/suppliers', icon: Truck, label: 'الموردين', permission: 'suppliers' },
            { path: '/purchases', icon: FileText, label: 'أوامر الشراء', permission: 'suppliers' },
        ],
    },
    {
        section: 'المبيعات',
        items: [
            { path: '/sales', icon: FileText, label: 'الفواتير', permission: 'sales' },
            { path: '/returns', icon: RotateCcw, label: 'المرتجعات', permission: 'sales' },
            { path: '/discounts', icon: Tag, label: 'الخصومات', permission: 'settings' },
            { path: '/installments', icon: Clock, label: 'التقسيط', permission: 'sales', feature: 'installments' },
            { path: '/preorders', icon: Clock, label: 'الحجوزات', permission: 'inventory', feature: 'preorders' },
        ],
    },
    {
        section: 'المالية',
        items: [
            { path: '/expenses', icon: DollarSign, label: 'المصروفات', permission: 'expenses' },
            { path: '/shifts', icon: Clock, label: 'الورديات', permission: 'shifts' },
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
    const { user, logout, businessConfig } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Check if user has permission (role-based)
    const hasPermission = (requiredPerm) => {
        if (!requiredPerm) return true;
        if (user?.role === 'ADMIN') return true;
        return user?.permissions?.includes(requiredPerm);
    };

    // Check if feature is enabled for this business type
    const isFeatureEnabled = (feature) => {
        if (!feature) return true; // No feature requirement = always show
        return businessConfig?.features?.[feature] ?? false;
    };

    // Check if item should be visible (both permission AND feature)
    const isItemVisible = (item) => {
        return hasPermission(item.permission) && isFeatureEnabled(item.feature);
    };

    // Check if section should be visible (at least one item visible)
    const isSectionVisible = (section) => {
        if (section.feature && !isFeatureEnabled(section.feature)) return false;
        return section.items.some(item => isItemVisible(item));
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">م</div>
                <span className="sidebar-brand">مخزن POS</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => {
                    // Skip section if not visible (feature disabled or no visible items)
                    if (!isSectionVisible(section)) return null;

                    const filteredItems = section.items.filter(item => isItemVisible(item));

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
