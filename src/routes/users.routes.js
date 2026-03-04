const router = require('express').Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { auditLog } = require('../middleware/audit');

// All user routes require admin access
router.use(authenticate, rbac('admin'));

router.get('/', usersController.listUsers);
router.get('/:id', usersController.getUser);
router.put('/:id', auditLog('UPDATE', 'users'), usersController.updateUser);
router.delete('/:id', auditLog('DELETE', 'users'), usersController.deactivateUser);

module.exports = router;
