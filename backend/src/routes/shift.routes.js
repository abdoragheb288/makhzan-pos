const router = require('express').Router();
const shiftController = require('../controllers/shift.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', shiftController.getAll);
router.get('/current', shiftController.getCurrent);
router.get('/:id', shiftController.getById);
router.post('/open', shiftController.open);
router.post('/:id/close', shiftController.close);
router.post('/:id/transaction', shiftController.addTransaction);

module.exports = router;
