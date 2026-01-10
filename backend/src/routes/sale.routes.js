const router = require('express').Router();
const saleController = require('../controllers/sale.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', saleController.getAll);
router.get('/:id', saleController.getById);
router.get('/invoice/:invoiceNumber', saleController.getByInvoice);
router.post('/:id/refund', authorize('ADMIN', 'MANAGER'), saleController.refund);

module.exports = router;
