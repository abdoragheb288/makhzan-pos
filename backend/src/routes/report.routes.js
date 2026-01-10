const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/sales/summary', reportController.getSalesSummary);
router.get('/sales/period', reportController.getSalesByPeriod);
router.get('/products/top', reportController.getTopProducts);
router.get('/inventory', reportController.getInventoryReport);
router.get('/branches/performance', reportController.getBranchPerformance);
router.get('/suppliers', reportController.getSupplierReport);

module.exports = router;
