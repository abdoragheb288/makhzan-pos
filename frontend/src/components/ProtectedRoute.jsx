import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useEffect, useState } from 'react';

// Permission to default path mapping for each permission type
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
    // Admin always goes to dashboard
    if (user?.role === 'ADMIN') {
        return '/';
    }

    // For non-admin users, find their first allowed page
    const permissions = user?.permissions || [];

    // Priority order for default page
    const priorityOrder = ['pos', 'products', 'inventory', 'reports', 'transfers', 'users', 'settings'];

    for (const perm of priorityOrder) {
        if (permissions.includes(perm)) {
            return PERMISSION_DEFAULT_PATHS[perm];
        }
    }

    // Fallback: if no permissions, still try to send to POS
    return '/pos';
}

export function ProtectedRoute({ children }) {
    const { isAuthenticated, user, token, logout } = useAuthStore();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Validate that we have both token and user
        const storedToken = localStorage.getItem('token');

        if (!storedToken || !token || !user) {
            // Clear any stale auth state
            logout();
        }
        setIsChecking(false);
    }, [token, user, logout]);

    // Show nothing while checking auth
    if (isChecking) {
        return null;
    }

    // Check both isAuthenticated flag AND token existence
    if (!isAuthenticated || !token || !localStorage.getItem('token')) {
        return <Navigate to="/login" state={{ from: location }} replace />;
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

    // Only redirect if truly authenticated with valid token
    if (isAuthenticated && token && localStorage.getItem('token')) {
        const redirectPath = getFirstAllowedPath(user);
        return <Navigate to={redirectPath} replace />;
    }

    return children;
}
