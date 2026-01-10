export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 2,
    }).format(amount);
};

export const formatNumber = (number) => {
    return new Intl.NumberFormat('ar-EG').format(number);
};

export const formatDate = (date, options = {}) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return new Intl.DateTimeFormat('ar-EG', { ...defaultOptions, ...options }).format(
        new Date(date)
    );
};

export const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
};

export const formatRelativeTime = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return 'منذ لحظات';
    if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    return formatDate(date);
};

export const getInitials = (name) => {
    if (!name) return '';
    const words = name.split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export const truncate = (str, length = 50) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
};

export const getRoleLabel = (role) => {
    const roles = {
        ADMIN: 'مدير',
        MANAGER: 'مشرف',
        CASHIER: 'كاشير',
    };
    return roles[role] || role;
};

export const getStatusLabel = (status) => {
    const statuses = {
        PENDING: 'قيد الانتظار',
        APPROVED: 'تمت الموافقة',
        IN_TRANSIT: 'في الطريق',
        COMPLETED: 'مكتمل',
        CANCELLED: 'ملغي',
        PARTIAL: 'جزئي',
        RECEIVED: 'مستلم',
    };
    return statuses[status] || status;
};

export const getStatusColor = (status) => {
    const colors = {
        PENDING: 'warning',
        APPROVED: 'primary',
        IN_TRANSIT: 'primary',
        COMPLETED: 'success',
        CANCELLED: 'danger',
        PARTIAL: 'warning',
        RECEIVED: 'success',
    };
    return colors[status] || 'gray';
};

export const getPaymentMethodLabel = (method) => {
    const methods = {
        CASH: 'نقدي',
        CARD: 'بطاقة',
        CREDIT: 'آجل',
    };
    return methods[method] || method;
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

export const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
