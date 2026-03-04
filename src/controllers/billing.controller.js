const billingService = require('../services/billing.service');

async function createInvoice(req, res, next) {
    try {
        const invoice = await billingService.createInvoice(req.body);
        res.status(201).json({ success: true, data: invoice });
    } catch (err) { next(err); }
}

async function listInvoices(req, res, next) {
    try {
        const invoices = await billingService.listInvoices(req.query, req.user.id, req.user.role);
        res.json({ success: true, data: invoices });
    } catch (err) { next(err); }
}

async function getInvoice(req, res, next) {
    try {
        const invoice = await billingService.getInvoiceById(req.params.id);
        res.json({ success: true, data: invoice });
    } catch (err) { next(err); }
}

async function markPaid(req, res, next) {
    try {
        const invoice = await billingService.markPaid(req.params.id);
        res.json({ success: true, data: invoice, message: 'Invoice marked as paid.' });
    } catch (err) { next(err); }
}

async function revenue(req, res, next) {
    try {
        const summary = await billingService.getRevenueSummary(
            parseInt(req.query.year, 10),
            req.query.month ? parseInt(req.query.month, 10) : null
        );
        res.json({ success: true, data: summary });
    } catch (err) { next(err); }
}

module.exports = { createInvoice, listInvoices, getInvoice, markPaid, revenue };
