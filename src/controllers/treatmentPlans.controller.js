const plansService = require('../services/treatmentPlans.service');

async function create(req, res, next) {
    try {
        const plan = await plansService.createPlan(req.user.id, req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (err) { next(err); }
}

async function list(req, res, next) {
    try {
        const plans = await plansService.listPlans(req.query, req.user.id, req.user.role);
        res.json({ success: true, data: plans });
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const plan = await plansService.getPlanById(req.params.id);
        res.json({ success: true, data: plan });
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const plan = await plansService.updatePlan(req.params.id, req.body);
        res.json({ success: true, data: plan });
    } catch (err) { next(err); }
}

async function addProgress(req, res, next) {
    try {
        const plan = await plansService.addProgress(req.params.id, req.body.note, req.user.id);
        res.json({ success: true, data: plan });
    } catch (err) { next(err); }
}

async function close(req, res, next) {
    try {
        const plan = await plansService.closePlan(req.params.id);
        res.json({ success: true, data: plan, message: 'Treatment plan closed.' });
    } catch (err) { next(err); }
}

module.exports = { create, list, getById, update, addProgress, close };
