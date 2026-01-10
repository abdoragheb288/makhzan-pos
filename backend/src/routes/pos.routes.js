const router = require('express').Router();
const posController = require('../controllers/pos.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/products', posController.getProducts);
router.get('/categories', posController.getCategories);
router.get('/barcode/:barcode', posController.searchByBarcode);
router.post('/sale', posController.createSale);

module.exports = router;
