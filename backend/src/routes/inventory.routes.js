const router = require('express').Router();
const inventoryController = require('../controllers/inventory.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', inventoryController.getAll);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/branch/:branchId', inventoryController.getByBranch);
router.put('/stock', authorize('ADMIN', 'MANAGER'), inventoryController.updateStock);
router.post('/adjust', authorize('ADMIN', 'MANAGER'), inventoryController.adjustStock);

module.exports = router;
