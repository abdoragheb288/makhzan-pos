/**
 * Customer Routes
 * /api/customers
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', customerController.getAll);
router.get('/search', customerController.searchByPhone);
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.post('/upsert', customerController.upsert);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.remove);

module.exports = router;
