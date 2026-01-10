const router = require('express').Router();
const categoryController = require('../controllers/category.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', categoryController.getAll);
router.get('/tree', categoryController.getTree);
router.get('/:id', categoryController.getById);
router.post('/', authorize('ADMIN', 'MANAGER'), categoryController.create);
router.put('/:id', authorize('ADMIN', 'MANAGER'), categoryController.update);
router.delete('/:id', authorize('ADMIN'), categoryController.remove);

module.exports = router;
