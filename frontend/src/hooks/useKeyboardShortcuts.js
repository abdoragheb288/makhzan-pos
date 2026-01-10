import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SHORTCUTS = [
    { key: 'F1', description: 'الذهاب للوحة التحكم', action: 'navigate', path: '/' },
    { key: 'F2', description: 'فتح نقطة البيع', action: 'navigate', path: '/pos' },
    { key: 'F3', description: 'بحث المنتجات', action: 'navigate', path: '/products' },
    { key: 'F4', description: 'المخزون', action: 'navigate', path: '/inventory' },
    { key: 'F5', description: 'المبيعات', action: 'navigate', path: '/sales' },
    { key: 'F6', description: 'التقارير', action: 'navigate', path: '/reports' },
    { key: 'F7', description: 'الإعدادات', action: 'navigate', path: '/settings' },
    { key: 'Escape', description: 'إغلاق النوافذ', action: 'closeModal' },
];

export function useKeyboardShortcuts(options = {}) {
    const navigate = useNavigate();
    const { onCloseModal } = options;

    const handleKeyDown = useCallback((event) => {
        // Skip if typing in input/textarea
        if (
            event.target.tagName === 'INPUT' ||
            event.target.tagName === 'TEXTAREA' ||
            event.target.isContentEditable
        ) {
            return;
        }

        const shortcut = SHORTCUTS.find((s) => s.key === event.key);
        if (!shortcut) return;

        event.preventDefault();

        switch (shortcut.action) {
            case 'navigate':
                navigate(shortcut.path);
                break;
            case 'closeModal':
                onCloseModal?.();
                break;
            default:
                break;
        }
    }, [navigate, onCloseModal]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return SHORTCUTS;
}

export { SHORTCUTS };
