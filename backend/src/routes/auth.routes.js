const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
        body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
    ],
    validate,
    authController.login
);

router.post(
    '/register',
    [
        body('name').notEmpty().withMessage('الاسم مطلوب'),
        body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    ],
    validate,
    authController.register
);

router.get('/profile', auth, authController.getProfile);

router.put('/profile', auth, authController.updateProfile);

module.exports = router;
