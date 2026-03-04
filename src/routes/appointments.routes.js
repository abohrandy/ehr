const router = require('express').Router();
const appointmentsController = require('../controllers/appointments.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/audit');
const {
    createAppointmentSchema,
    rescheduleSchema,
    cancelSchema,
    slotsQuerySchema,
    calendarQuerySchema,
} = require('../validators/appointments.validator');

router.use(authenticate);

router.get('/slots', validate(slotsQuerySchema, 'query'), appointmentsController.getSlots);
router.get('/calendar', rbac('admin', 'therapist'), validate(calendarQuerySchema, 'query'), appointmentsController.calendar);
router.post('/', rbac('admin', 'therapist'), validate(createAppointmentSchema), auditLog('CREATE', 'appointments'), appointmentsController.book);
router.get('/', appointmentsController.list);
router.get('/:id', appointmentsController.getById);
router.put('/:id', rbac('admin', 'therapist'), validate(rescheduleSchema), auditLog('UPDATE', 'appointments'), appointmentsController.reschedule);
router.patch('/:id/cancel', rbac('admin', 'therapist', 'client'), validate(cancelSchema), auditLog('UPDATE', 'appointments'), appointmentsController.cancel);

module.exports = router;
