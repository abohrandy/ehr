const router = require('express').Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { auditLog } = require('../middleware/audit');

// All settings routes are admin-only
router.use(authenticate, rbac('admin'));

router.get('/', settingsController.getSettings);
router.put('/', auditLog('UPDATE_SETTINGS', 'settings'), settingsController.updateSettings);

module.exports = router;
