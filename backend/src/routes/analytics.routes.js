const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/profitability', analyticsController.getProductProfitability);
router.get('/peak-hours', analyticsController.getPeakHours);
router.get('/central-inventory', analyticsController.getCentralInventory);
router.get('/season-alerts', analyticsController.getSeasonAlerts);

module.exports = router;
