const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}${day}-${random}`;
};

const generateSKU = (categoryCode, productName) => {
    const prefix = categoryCode.toUpperCase().slice(0, 3);
    const name = productName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${name}-${random}`;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
    }).format(amount);
};

const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(2);
};

const paginationHelper = (page = 1, limit = 10) => {
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 10;
    const skip = (p - 1) * l;
    return { skip, take: l };
};

const buildPaginationResponse = (data, total, page, limit) => {
    return {
        data,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    };
};

module.exports = {
    generateInvoiceNumber,
    generateSKU,
    formatCurrency,
    calculatePercentage,
    paginationHelper,
    buildPaginationResponse,
};
