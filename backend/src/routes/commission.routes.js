const router = require('express').Router();
const commissionController = require('../controllers/commission.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', commissionController.getAll);
router.get('/summary', commissionController.getSummary);
router.get('/settings', commissionController.getSettings);
router.post('/pay', commissionController.markPaid);

module.exports = router;
