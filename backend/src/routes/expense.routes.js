const router = require('express').Router();
const expenseController = require('../controllers/expense.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', expenseController.getAll);
router.get('/summary', expenseController.getSummary);
router.get('/categories', expenseController.getCategories);
router.post('/', expenseController.create);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.remove);

module.exports = router;
