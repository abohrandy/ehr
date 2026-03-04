const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/clients', require('./clients.routes'));
router.use('/appointments', require('./appointments.routes'));
router.use('/session-notes', require('./sessionNotes.routes'));
router.use('/treatment-plans', require('./treatmentPlans.routes'));
router.use('/messages', require('./messages.routes'));
router.use('/billing', require('./billing.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/availability', require('./availability.routes'));

module.exports = router;
