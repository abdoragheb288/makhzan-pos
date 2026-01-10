const router = require('express').Router();
const recurringController = require('../controllers/recurring.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', recurringController.getAll);
router.get('/pending', recurringController.getPending);
router.post('/', recurringController.create);
router.post('/:id/pay', recurringController.payExpense);
router.patch('/:id/toggle', recurringController.toggleActive);
router.delete('/:id', recurringController.remove);

module.exports = router;
