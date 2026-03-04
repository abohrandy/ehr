const appointmentsService = require('../services/appointments.service');
const db = require('../db/knex');

async function getSlots(req, res, next) {
    try {
        const slots = await appointmentsService.getSlots(req.query.therapist_id, req.query.date);
        res.json({ success: true, data: slots });
    } catch (err) { next(err); }
}

async function book(req, res, next) {
    try {
        const appointment = await appointmentsService.bookAppointment(req.body);
        res.status(201).json({ success: true, data: appointment });
    } catch (err) { next(err); }
}

async function list(req, res, next) {
    try {
        let query = db('appointments')
            .leftJoin('clients', 'appointments.client_id', 'clients.id')
            .leftJoin('users as client_user', 'clients.user_id', 'client_user.id')
            .leftJoin('users as therapist_user', 'appointments.therapist_id', 'therapist_user.id')
            .select(
                'appointments.*',
                'client_user.first_name as client_first_name',
                'client_user.last_name as client_last_name',
                'therapist_user.first_name as therapist_first_name',
                'therapist_user.last_name as therapist_last_name'
            );

        if (req.user.role === 'therapist') {
            query = query.where('appointments.therapist_id', req.user.id);
        } else if (req.user.role === 'client') {
            const client = await db('clients').where({ user_id: req.user.id }).first();
            if (client) query = query.where('appointments.client_id', client.id);
        }

        if (req.query.status) query = query.where('appointments.status', req.query.status);

        const appointments = await query.orderBy('appointments.start_time', 'desc');
        res.json({ success: true, data: appointments });
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const appointment = await db('appointments')
            .leftJoin('clients', 'appointments.client_id', 'clients.id')
            .leftJoin('users as client_user', 'clients.user_id', 'client_user.id')
            .select('appointments.*', 'client_user.first_name as client_first_name', 'client_user.last_name as client_last_name')
            .where('appointments.id', req.params.id)
            .first();

        if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found.' });
        res.json({ success: true, data: appointment });
    } catch (err) { next(err); }
}

async function reschedule(req, res, next) {
    try {
        const appointment = await appointmentsService.reschedule(req.params.id, req.body.start_time);
        res.json({ success: true, data: appointment });
    } catch (err) { next(err); }
}

async function cancel(req, res, next) {
    try {
        const appointment = await appointmentsService.cancel(req.params.id, req.body.cancelled_reason);
        res.json({ success: true, data: appointment });
    } catch (err) { next(err); }
}

async function calendar(req, res, next) {
    try {
        const data = await appointmentsService.getCalendar({
            therapist_id: req.query.therapist_id,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
        });
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

module.exports = { getSlots, book, list, getById, reschedule, cancel, calendar };
