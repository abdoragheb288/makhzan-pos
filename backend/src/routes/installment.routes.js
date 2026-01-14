const router = require('express').Router();
const installmentController = require('../controllers/installment.controller');
const { auth } = require('../middleware/auth.middleware');
const { requireFeature } = require('../middleware/featureGuard');

router.use(auth);
router.use(requireFeature('installments')); // Only for business types that support installments

router.get('/', installmentController.getAll);
router.get('/overdue', installmentController.getOverdue);
router.get('/:id', installmentController.getById);
router.post('/', installmentController.create);
router.post('/:id/payment', installmentController.addPayment);

module.exports = router;

