const router = require('express').Router();
const transferController = require('../controllers/transfer.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', transferController.getTransfers);
router.post('/', authorize('ADMIN', 'MANAGER'), transferController.createTransfer);
// router.get('/:id', transferController.getById); // Not implemented yet
// router.put('/:id/status', authorize('ADMIN', 'MANAGER'), transferController.updateStatus); // Not implemented yet

module.exports = router;
