const router = require('express').Router();
const installmentController = require('../controllers/installment.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', installmentController.getAll);
router.get('/overdue', installmentController.getOverdue);
router.get('/:id', installmentController.getById);
router.post('/', installmentController.create);
router.post('/:id/payment', installmentController.addPayment);

module.exports = router;
