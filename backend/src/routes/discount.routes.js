const router = require('express').Router();
const discountController = require('../controllers/discount.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', discountController.getAll);
router.get('/code/:code', discountController.getByCode);
router.get('/:id', discountController.getById);
router.post('/', discountController.create);
router.put('/:id', discountController.update);
router.delete('/:id', discountController.remove);
router.post('/:id/use', discountController.incrementUsage);

module.exports = router;
