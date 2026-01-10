const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const tenantController = require('../controllers/tenant.controller');
const subscriptionController = require('../controllers/subscription.controller');
const { superAdminAuth } = require('../middleware/superadmin.middleware');

// Public routes
router.post('/login', superadminController.login);

// Protected routes (require super admin auth)
router.use(superAdminAuth);

// Dashboard
router.get('/profile', superadminController.getProfile);
router.get('/dashboard', superadminController.getDashboardStats);

// Tenants
router.get('/tenants', tenantController.getAll);
router.get('/tenants/:id', tenantController.getById);
router.post('/tenants', tenantController.create);
router.put('/tenants/:id', tenantController.update);
router.post('/tenants/:id/suspend', tenantController.suspend);
router.post('/tenants/:id/activate', tenantController.activate);
router.delete('/tenants/:id', tenantController.delete);

// Subscriptions
router.get('/subscriptions', subscriptionController.getAll);
router.post('/subscriptions', subscriptionController.create);
router.post('/subscriptions/:id/extend', subscriptionController.extend);
router.post('/subscriptions/:id/cancel', subscriptionController.cancel);

module.exports = router;
