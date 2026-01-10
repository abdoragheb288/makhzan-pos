const router = require('express').Router();
const productController = require('../controllers/product.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', productController.getAll);
router.get('/barcode/:barcode', productController.searchByBarcode);
router.get('/:id', productController.getById);
router.post('/', authorize('ADMIN', 'MANAGER'), productController.create);
router.put('/:id', authorize('ADMIN', 'MANAGER'), productController.update);
router.delete('/:id', authorize('ADMIN'), productController.remove);

// Variants
router.post('/:id/variants', authorize('ADMIN', 'MANAGER'), productController.addVariant);
router.put('/:id/variants/:variantId', authorize('ADMIN', 'MANAGER'), productController.updateVariant);
router.delete('/:id/variants/:variantId', authorize('ADMIN', 'MANAGER'), productController.removeVariant);

module.exports = router;
