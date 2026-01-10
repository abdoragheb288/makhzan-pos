const router = require('express').Router();
const returnController = require('../controllers/return.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', returnController.getAll);
router.get('/reasons', returnController.getReturnReasons);
router.get('/:id', returnController.getById);
router.post('/', returnController.create);

module.exports = router;
