import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useEffect, useState } from 'react';

// Route to required permission mapping
const ROUTE_PERMISSIONS = {
    '/': null, // Dashboard - Admin only
    '/pos': 'pos',
    '/products': 'products',
    '/categories': 'products', // Categories is under products
    '/inventory': 'inventory',
    '/transfers': 'transfers',
    '/users': 'users',
    '/branches': 'branches',
    '/suppliers': 'suppliers',
    '/purchases': 'purchases',
    '/sales': 'sales',
    '/reports': 'reports',
    '/settings': 'settings',
    '/shifts': 'shifts',
    '/expenses': 'expenses',
    '/returns': 'returns',
    '/installments': 'installments',
    '/preorders': 'preorders',
    '/analytics': 'analytics',
    // Restaurant Routes
    '/restaurant-pos': 'pos',
    '/tables': 'tables',
    '/orders': 'orders',
    '/kitchen': 'orders',
};

// Permission to default path mapping
const PERMISSION_DEFAULT_PATHS = {
    pos: '/pos',
    products: '/products',
    inventory: '/inventory',
    transfers: '/transfers',
    users: '/users',
    settings: '/settings',
    reports: '/reports',
};

// Get the first allowed path for a user based on their permissions
function getFirstAllowedPath(user) {
    if (user?.role === 'ADMIN') {
        return '/';
    }

    const permissions = user?.permissions || [];
    const priorityOrder = ['pos', 'products', 'inventory', 'reports', 'transfers', 'users', 'settings'];

    for (const perm of priorityOrder) {
        if (permissions.includes(perm)) {
            return PERMISSION_DEFAULT_PATHS[perm];
        }
    }

    return '/pos';
}

// Check if user has permission for a specific route
function hasPermissionForRoute(user, pathname) {
    // Admin has access to everything
    if (user?.role === 'ADMIN') {
        return true;
    }

    // Get required permission for this route
    const requiredPermission = ROUTE_PERMISSIONS[pathname];

    // If route doesn't require specific permission (like dashboard), only admin can access
    if (requiredPermission === null) {
        return user?.role === 'ADMIN';
    }

    // If route is not in our mapping, deny by default
    if (requiredPermission === undefined) {
        // Check if it's a sub-route of a known route
        for (const [route, perm] of Object.entries(ROUTE_PERMISSIONS)) {
            if (pathname.startsWith(route) && route !== '/') {
                const permissions = user?.permissions || [];
                return perm === null ? user?.role === 'ADMIN' : permissions.includes(perm);
            }
        }
        return false;
    }

    // Check if user has the required permission
    const permissions = user?.permissions || [];
    return permissions.includes(requiredPermission);
}

export function ProtectedRoute({ children }) {
    const { isAuthenticated, user, token, logout } = useAuthStore();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('token');

        if (!storedToken || !token || !user) {
            logout();
        }
        setIsChecking(false);
    }, [token, user, logout]);

    if (isChecking) {
        return null;
    }

    // Check authentication
    if (!isAuthenticated || !token || !sessionStorage.getItem('token')) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check permission for the current route
    if (!hasPermissionForRoute(user, location.pathname)) {
        // Redirect to their first allowed page instead of showing an error
        const firstAllowedPath = getFirstAllowedPath(user);
        return <Navigate to={firstAllowedPath} replace />;
    }

    // If user is on the root path "/" and is not admin, redirect to their first allowed page
    if (location.pathname === '/' && user?.role !== 'ADMIN') {
        const firstAllowedPath = getFirstAllowedPath(user);
        return <Navigate to={firstAllowedPath} replace />;
    }

    return children;
}

export function PublicRoute({ children }) {
    const { isAuthenticated, user, token } = useAuthStore();

    if (isAuthenticated && token && sessionStorage.getItem('token')) {
        const redirectPath = getFirstAllowedPath(user);
        return <Navigate to={redirectPath} replace />;
    }

    return children;
}
