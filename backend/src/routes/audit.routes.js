const router = require('express').Router();
const auditController = require('../controllers/audit.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

router.get('/', auditController.getAll);
router.get('/summary', auditController.getSummary);
router.get('/:entity/:entityId', auditController.getByEntity);
router.post('/', auditController.create);

module.exports = router;
