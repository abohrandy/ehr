const router = require('express').Router();
const messagesController = require('../controllers/messages.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { sendMessageSchema } = require('../validators/messages.validator');

router.use(authenticate, rbac('admin', 'therapist', 'client'));

router.post('/', validate(sendMessageSchema), messagesController.send);
router.get('/conversations', messagesController.listConversations);
router.get('/conversations/:id', messagesController.getConversation);
router.patch('/:id/read', messagesController.markAsRead);
router.post('/upload', messagesController.upload.single('file'), messagesController.uploadAttachment);

module.exports = router;
