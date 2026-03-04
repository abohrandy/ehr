const router = require('express').Router();
const clientsController = require('../controllers/clients.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/audit');
const { createClientSchema, updateClientSchema, linkRelationshipSchema } = require('../validators/clients.validator');

router.use(authenticate);

router.post('/', rbac('admin', 'therapist'), validate(createClientSchema), auditLog('CREATE', 'clients'), clientsController.createClient);
router.get('/', rbac('admin', 'therapist'), clientsController.listClients);
router.get('/:id', rbac('admin', 'therapist', 'client'), clientsController.getClient);
router.put('/:id', rbac('admin', 'therapist'), validate(updateClientSchema), auditLog('UPDATE', 'clients'), clientsController.updateClient);
router.post('/link', rbac('admin', 'therapist'), validate(linkRelationshipSchema), auditLog('CREATE', 'family_relationship_links'), clientsController.linkRelationship);
router.get('/:id/relationships', rbac('admin', 'therapist'), clientsController.getRelationships);

module.exports = router;
