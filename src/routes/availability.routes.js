const router = require('express').Router();
const availabilityController = require('../controllers/availability.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');

// Public/Internal slot lookup
router.get('/slots', authenticate, availabilityController.getAvailableSlots);

// Therapist configuration
router.get('/', authenticate, availabilityController.getAvailability);
router.get('/:therapist_id', authenticate, rbac('admin', 'therapist'), availabilityController.getAvailability);
router.put('/', authenticate, rbac('admin', 'therapist'), availabilityController.setAvailability);
router.put('/:therapist_id', authenticate, rbac('admin'), availabilityController.setAvailability);

module.exports = router;
