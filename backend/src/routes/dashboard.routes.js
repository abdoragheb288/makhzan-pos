const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/stats', dashboardController.getStats);
router.get('/recent-sales', dashboardController.getRecentSales);
router.get('/sales-chart', dashboardController.getSalesChart);
router.get('/low-stock', dashboardController.getLowStockAlerts);
router.get('/top-products', dashboardController.getTopProducts);

module.exports = router;
