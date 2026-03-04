const router = require('express').Router();
const plansController = require('../controllers/treatmentPlans.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/audit');
const { createPlanSchema, updatePlanSchema, progressNoteSchema } = require('../validators/treatmentPlans.validator');

router.use(authenticate);

router.post('/', rbac('admin', 'therapist'), validate(createPlanSchema), auditLog('CREATE', 'treatment_plans'), plansController.create);
router.get('/', rbac('admin', 'therapist', 'client'), plansController.list);
router.get('/:id', rbac('admin', 'therapist', 'client'), plansController.getById);
router.put('/:id', rbac('admin', 'therapist'), validate(updatePlanSchema), auditLog('UPDATE', 'treatment_plans'), plansController.update);
router.patch('/:id/progress', rbac('admin', 'therapist'), validate(progressNoteSchema), auditLog('UPDATE', 'treatment_plans'), plansController.addProgress);
router.patch('/:id/close', rbac('admin', 'therapist'), auditLog('UPDATE', 'treatment_plans'), plansController.close);

module.exports = router;
