const db = require('../db/knex');

/**
 * Create a treatment plan.
 */
async function createPlan(therapistId, data) {
    const [plan] = await db('treatment_plans')
        .insert({
            ...data,
            therapist_id: therapistId,
            goals: JSON.stringify(data.goals || []),
            progress_notes: JSON.stringify([]),
        })
        .returning('*');

    return plan;
}

/**
 * List treatment plans.
 */
async function listPlans(filters, therapistId, role) {
    let query = db('treatment_plans')
        .leftJoin('clients', 'treatment_plans.client_id', 'clients.id')
        .leftJoin('users as client_user', 'clients.user_id', 'client_user.id')
        .select(
            'treatment_plans.*',
            'client_user.first_name as client_first_name',
            'client_user.last_name as client_last_name'
        );

    if (role === 'therapist') {
        query = query.where('treatment_plans.therapist_id', therapistId);
    }

    if (filters.client_id) query = query.where('treatment_plans.client_id', filters.client_id);
    if (filters.status) query = query.where('treatment_plans.status', filters.status);

    return query.orderBy('treatment_plans.created_at', 'desc');
}

/**
 * Get plan by ID.
 */
async function getPlanById(planId) {
    const plan = await db('treatment_plans')
        .leftJoin('clients', 'treatment_plans.client_id', 'clients.id')
        .leftJoin('users as client_user', 'clients.user_id', 'client_user.id')
        .select(
            'treatment_plans.*',
            'client_user.first_name as client_first_name',
            'client_user.last_name as client_last_name'
        )
        .where('treatment_plans.id', planId)
        .first();

    if (!plan) {
        const error = new Error('Treatment plan not found.');
        error.statusCode = 404;
        throw error;
    }

    return plan;
}

/**
 * Update plan goals/objectives.
 */
async function updatePlan(planId, data) {
    const updateData = { ...data, updated_at: db.fn.now() };
    if (data.goals) updateData.goals = JSON.stringify(data.goals);

    const [plan] = await db('treatment_plans')
        .where({ id: planId })
        .update(updateData)
        .returning('*');

    if (!plan) {
        const error = new Error('Treatment plan not found.');
        error.statusCode = 404;
        throw error;
    }

    return plan;
}

/**
 * Add progress note entry.
 */
async function addProgress(planId, note, userId) {
    const plan = await db('treatment_plans').where({ id: planId }).first();
    if (!plan) {
        const error = new Error('Treatment plan not found.');
        error.statusCode = 404;
        throw error;
    }

    const progressNotes = plan.progress_notes || [];
    progressNotes.push({
        date: new Date().toISOString(),
        note,
        updated_by: userId,
    });

    const [updated] = await db('treatment_plans')
        .where({ id: planId })
        .update({
            progress_notes: JSON.stringify(progressNotes),
            updated_at: db.fn.now(),
        })
        .returning('*');

    return updated;
}

/**
 * Close a treatment plan.
 */
async function closePlan(planId) {
    const [plan] = await db('treatment_plans')
        .where({ id: planId })
        .update({
            status: 'closed',
            updated_at: db.fn.now(),
        })
        .returning('*');

    if (!plan) {
        const error = new Error('Treatment plan not found.');
        error.statusCode = 404;
        throw error;
    }

    return plan;
}

module.exports = { createPlan, listPlans, getPlanById, updatePlan, addProgress, closePlan };
