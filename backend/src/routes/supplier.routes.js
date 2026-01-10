const router = require('express').Router();
const supplierController = require('../controllers/supplier.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.post('/', authorize('ADMIN', 'MANAGER'), supplierController.create);
router.put('/:id', authorize('ADMIN', 'MANAGER'), supplierController.update);
router.delete('/:id', authorize('ADMIN'), supplierController.remove);

module.exports = router;
