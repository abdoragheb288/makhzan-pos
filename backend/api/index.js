require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const authRoutes = require('../src/routes/auth.routes');
const userRoutes = require('../src/routes/user.routes');
const branchRoutes = require('../src/routes/branch.routes');
const categoryRoutes = require('../src/routes/category.routes');
const productRoutes = require('../src/routes/product.routes');
const inventoryRoutes = require('../src/routes/inventory.routes');
const transferRoutes = require('../src/routes/transfer.routes');
const supplierRoutes = require('../src/routes/supplier.routes');
const purchaseRoutes = require('../src/routes/purchase.routes');
const saleRoutes = require('../src/routes/sale.routes');
const posRoutes = require('../src/routes/pos.routes');
const reportRoutes = require('../src/routes/report.routes');
const dashboardRoutes = require('../src/routes/dashboard.routes');
const returnRoutes = require('../src/routes/return.routes');
const expenseRoutes = require('../src/routes/expense.routes');
const shiftRoutes = require('../src/routes/shift.routes');
const discountRoutes = require('../src/routes/discount.routes');

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/installments', require('../src/routes/installment.routes'));
app.use('/api/audit', require('../src/routes/audit.routes'));
app.use('/api/preorders', require('../src/routes/preorder.routes'));
app.use('/api/recurring-expenses', require('../src/routes/recurring.routes'));
app.use('/api/commissions', require('../src/routes/commission.routes'));
app.use('/api/analytics', require('../src/routes/analytics.routes'));
app.use('/api/superadmin', require('../src/routes/superadmin.routes'));

// Restaurant/Cafe specific routes (feature-gated)
app.use('/api/tables', require('../src/routes/table.routes'));
app.use('/api/orders', require('../src/routes/order.routes'));
app.use('/api/customers', require('../src/routes/customerRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/api', (req, res) => {
    res.json({ message: 'Makhzan POS API', version: '1.0.0' });
});

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
