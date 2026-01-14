/**
 * Order Routes
 * Restaurant/Cafe order management
 * Protected by requireFeature('orders')
 */

const router = require('express').Router();
const orderController = require('../controllers/order.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const { requireFeature } = require('../middleware/featureGuard');

router.use(auth);
router.use(requireFeature('orders')); // Only for restaurant/cafe business types

// Get all orders
router.get('/', orderController.getAll);

// Get active orders (for kitchen display)
router.get('/active', orderController.getActive);

// Get single order
router.get('/:id', orderController.getById);

// Create order
router.post('/', orderController.create);

// Add items to order
router.post('/:id/items', orderController.addItems);

// Update order status
router.patch('/:id/status', orderController.updateStatus);

// Convert order to sale/invoice
router.post('/:id/checkout', orderController.convertToSale);

// Cancel order
router.post('/:id/cancel', orderController.cancel);

module.exports = router;
