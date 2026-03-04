const router = require('express').Router();
const billingController = require('../controllers/billing.controller');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLog } = require('../middleware/audit');
const { createInvoiceSchema, revenueQuerySchema } = require('../validators/billing.validator');

router.use(authenticate);

router.post('/invoices', rbac('admin', 'therapist'), validate(createInvoiceSchema), auditLog('CREATE', 'invoices'), billingController.createInvoice);
router.get('/invoices', billingController.listInvoices);
router.get('/invoices/:id', billingController.getInvoice);
router.patch('/invoices/:id/pay', rbac('admin', 'therapist'), auditLog('UPDATE', 'invoices'), billingController.markPaid);
router.get('/revenue', rbac('admin'), validate(revenueQuerySchema, 'query'), billingController.revenue);

module.exports = router;
