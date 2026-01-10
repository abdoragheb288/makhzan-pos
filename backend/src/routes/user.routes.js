const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', authorize('ADMIN', 'MANAGER'), userController.getAll);
router.get('/:id', authorize('ADMIN', 'MANAGER'), userController.getById);
router.post('/', authorize('ADMIN'), userController.create);
router.put('/:id', authorize('ADMIN'), userController.update);
router.delete('/:id', authorize('ADMIN'), userController.remove);

module.exports = router;
