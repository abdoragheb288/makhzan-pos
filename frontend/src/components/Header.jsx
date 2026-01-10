import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Menu, Moon, Sun, Globe, X, Keyboard } from 'lucide-react';
import { useUIStore, useThemeStore, useNotificationStore, useI18nStore } from '../store';
import { useKeyboardShortcuts, SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { formatDateTime } from '../utils/helpers';

const pageTitles = {
    '/': 'لوحة التحكم',
    '/pos': 'نقطة البيع',
    '/products': 'المنتجات',
    '/categories': 'التصنيفات',
    '/inventory': 'المخزون',
    '/transfers': 'نقل البضائع',
    '/branches': 'الفروع',
    '/suppliers': 'الموردين',
    '/purchases': 'أوامر الشراء',
    '/sales': 'الفواتير',
    '/returns': 'المرتجعات',
    '/expenses': 'المصروفات',
    '/shifts': 'الورديات',
    '/discounts': 'الخصومات',
    '/reports': 'التقارير',
    '/users': 'المستخدمين',
    '/settings': 'الإعدادات',
};

export default function Header() {
    const location = useLocation();
    const { toggleSidebar } = useUIStore();
    const { theme, toggleTheme, initTheme } = useThemeStore();
    const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotificationStore();
    const { locale, setLocale, initLocale } = useI18nStore();

    const [showNotifications, setShowNotifications] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const notifRef = useRef(null);

    // Initialize theme and locale on mount
    useEffect(() => {
        initTheme();
        initLocale();
    }, []);

    // Enable keyboard shortcuts
    useKeyboardShortcuts({
        onCloseModal: () => {
            setShowNotifications(false);
            setShowShortcuts(false);
        },
    });

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const title = pageTitles[location.pathname] || 'مخزن POS';

    return (
        <header className="header">
            <div className="header-left">
                <button className="header-icon-btn" onClick={toggleSidebar}>
                    <Menu size={22} />
                </button>
                <h1 className="header-title">{title}</h1>
            </div>

            <div className="header-right">
                {/* Search */}
                <div className="search-input" style={{ width: 280 }}>
                    <input
                        type="text"
                        placeholder="بحث..."
                        style={{ paddingRight: 44 }}
                    />
                    <Search className="search-icon" size={18} />
                </div>

                {/* Keyboard Shortcuts */}
                <button
                    className="header-icon-btn"
                    onClick={() => setShowShortcuts(true)}
                    title="اختصارات لوحة المفاتيح"
                >
                    <Keyboard size={22} />
                </button>

                {/* Language Toggle */}
                <button
                    className="header-icon-btn"
                    onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                    title={locale === 'ar' ? 'English' : 'عربي'}
                >
                    <Globe size={22} />
                    <span style={{ fontSize: '0.65rem', position: 'absolute', bottom: 2, right: 2, fontWeight: 700 }}>
                        {locale.toUpperCase()}
                    </span>
                </button>

                {/* Theme Toggle */}
                <button
                    className="header-icon-btn"
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
                >
                    {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
                </button>

                {/* Notifications */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <button
                        className="header-icon-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="notification-badge">{unreadCount}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="dropdown-menu notifications-dropdown">
                            <div className="dropdown-header">
                                <h4>الإشعارات</h4>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="btn btn-ghost btn-sm">
                                        قراءة الكل
                                    </button>
                                )}
                            </div>
                            <div className="dropdown-body">
                                {notifications.length === 0 ? (
                                    <div className="empty-notifications">
                                        <Bell size={32} color="var(--text-muted)" />
                                        <p>لا توجد إشعارات</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 5).map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                            onClick={() => markAsRead(notif.id)}
                                        >
                                            <div className="notification-content">
                                                <p className="notification-title">{notif.title}</p>
                                                <p className="notification-message">{notif.message}</p>
                                            </div>
                                            <span className="notification-time">
                                                {formatDateTime(notif.createdAt)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Shortcuts Modal */}
            {showShortcuts && (
                <div className="modal-overlay" onClick={() => setShowShortcuts(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <Keyboard size={20} style={{ marginLeft: 8 }} />
                                اختصارات لوحة المفاتيح
                            </h3>
                            <button className="modal-close" onClick={() => setShowShortcuts(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {SHORTCUTS.map((shortcut) => (
                                    <div
                                        key={shortcut.key}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--border-radius-sm)',
                                        }}
                                    >
                                        <span>{shortcut.description}</span>
                                        <kbd style={{
                                            background: 'var(--bg-secondary)',
                                            padding: '4px 10px',
                                            borderRadius: 4,
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            border: '1px solid var(--border-color)',
                                        }}>
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
