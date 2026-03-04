const router = require('express').Router();
const notesController = require('../controllers/sessionNotes.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/audit');
const { createNoteSchema, updateNoteSchema, searchNotesSchema } = require('../validators/sessionNotes.validator');

router.use(authenticate, rbac('admin', 'therapist'));

router.post('/', validate(createNoteSchema), auditLog('CREATE', 'session_notes'), notesController.create);
router.get('/', validate(searchNotesSchema, 'query'), notesController.list);
router.get('/:id', notesController.getById);
router.put('/:id', validate(updateNoteSchema), auditLog('UPDATE', 'session_notes'), notesController.update);
router.patch('/:id/lock', auditLog('LOCK', 'session_notes'), notesController.lock);
router.get('/:id/pdf', auditLog('EXPORT', 'session_notes'), notesController.exportPdf);

module.exports = router;
