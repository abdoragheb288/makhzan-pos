/**
 * Table Routes
 * Restaurant/Cafe table management
 * Protected by requireFeature('tables')
 */

const router = require('express').Router();
const tableController = require('../controllers/table.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const { requireFeature } = require('../middleware/featureGuard');

router.use(auth);
router.use(requireFeature('tables')); // Only for restaurant/cafe business types

// Get all tables
router.get('/', tableController.getAll);

// Get single table
router.get('/:id', tableController.getById);

// Create table (Admin/Manager only)
router.post('/', authorize('ADMIN', 'MANAGER'), tableController.create);

// Update table
router.put('/:id', authorize('ADMIN', 'MANAGER'), tableController.update);

// Update table status only (any authenticated user)
router.patch('/:id/status', tableController.updateStatus);

// Delete table (Admin only)
router.delete('/:id', authorize('ADMIN'), tableController.remove);

module.exports = router;
