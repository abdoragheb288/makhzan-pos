const router = require('express').Router();
const purchaseController = require('../controllers/purchase.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', purchaseController.getAll);
router.get('/:id', purchaseController.getById);
router.post('/', authorize('ADMIN', 'MANAGER'), purchaseController.create);
router.post('/:id/receive', authorize('ADMIN', 'MANAGER'), purchaseController.receive);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), purchaseController.cancel);

module.exports = router;
