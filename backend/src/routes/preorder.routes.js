const router = require('express').Router();
const preorderController = require('../controllers/preorder.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', preorderController.getAll);
router.get('/available', preorderController.checkAvailable);
router.post('/', preorderController.create);
router.patch('/:id/notify', preorderController.markNotified);
router.patch('/:id/complete', preorderController.complete);
router.patch('/:id/cancel', preorderController.cancel);

module.exports = router;
