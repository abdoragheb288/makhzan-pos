const router = require('express').Router();
const branchController = require('../controllers/branch.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', branchController.getAll);
router.get('/warehouses', branchController.getWarehouses);
router.get('/:id', branchController.getById);
router.post('/', authorize('ADMIN'), branchController.create);
router.put('/:id', authorize('ADMIN'), branchController.update);
router.delete('/:id', authorize('ADMIN'), branchController.remove);

module.exports = router;
