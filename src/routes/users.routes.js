const router = require('express').Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { auditLog } = require('../middleware/audit');

// Profile route (any authenticated user)
router.put('/profile', authenticate, auditLog('UPDATE_PROFILE', 'users'), usersController.updateProfile);

// Admin-only routes
router.use(authenticate, rbac('admin'));

router.get('/', usersController.listUsers);
router.post('/', auditLog('CREATE', 'users'), usersController.createUser);
router.get('/:id', usersController.getUser);
router.put('/:id', auditLog('UPDATE', 'users'), usersController.updateUser);
router.delete('/:id', auditLog('DELETE', 'users'), usersController.deactivateUser);

module.exports = router;
