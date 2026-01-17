require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// =====================================================
// EARLY HEALTH CHECK - Responds immediately on cold start
// =====================================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
    res.json({ message: 'Makhzan POS API', version: '1.0.0' });
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// API Routes - Inline requires to avoid undefined variables
// =====================================================
app.use('/api/auth', require('../src/routes/auth.routes'));
app.use('/api/users', require('../src/routes/user.routes'));
app.use('/api/branches', require('../src/routes/branch.routes'));
app.use('/api/categories', require('../src/routes/category.routes'));
app.use('/api/products', require('../src/routes/product.routes'));
app.use('/api/inventory', require('../src/routes/inventory.routes'));
app.use('/api/transfers', require('../src/routes/transfer.routes'));
app.use('/api/suppliers', require('../src/routes/supplier.routes'));
app.use('/api/purchases', require('../src/routes/purchase.routes'));
app.use('/api/sales', require('../src/routes/sale.routes'));
app.use('/api/pos', require('../src/routes/pos.routes'));
app.use('/api/reports', require('../src/routes/report.routes'));
app.use('/api/dashboard', require('../src/routes/dashboard.routes'));
app.use('/api/returns', require('../src/routes/return.routes'));
app.use('/api/expenses', require('../src/routes/expense.routes'));
app.use('/api/shifts', require('../src/routes/shift.routes'));
app.use('/api/discounts', require('../src/routes/discount.routes'));
app.use('/api/installments', require('../src/routes/installment.routes'));
app.use('/api/audit', require('../src/routes/audit.routes'));
app.use('/api/preorders', require('../src/routes/preorder.routes'));
app.use('/api/recurring-expenses', require('../src/routes/recurring.routes'));
app.use('/api/commissions', require('../src/routes/commission.routes'));
app.use('/api/analytics', require('../src/routes/analytics.routes'));
app.use('/api/superadmin', require('../src/routes/superadmin.routes'));

// Restaurant/Cafe specific routes
app.use('/api/tables', require('../src/routes/table.routes'));
app.use('/api/orders', require('../src/routes/order.routes'));
app.use('/api/customers', require('../src/routes/customerRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

module.exports = app;
