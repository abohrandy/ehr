const db = require('../db/knex');
const config = require('../config');
const { getAvailableSlots, hasOverlap } = require('../utils/dateHelpers');

/**
 * Get available time slots for a therapist on a given date.
 */
async function getSlots(therapistId, date) {
    const dateStr = new Date(date).toISOString().split('T')[0];

    const bookedSlots = await db('appointments')
        .where({ therapist_id: therapistId })
        .whereNot({ status: 'cancelled' })
        .whereRaw("DATE(start_time) = ?", [dateStr])
        .select('start_time', 'buffer_end_time');

    return getAvailableSlots(dateStr, bookedSlots);
}

/**
 * Book a new appointment with overlap protection.
 */
async function bookAppointment({ therapist_id, client_id, start_time, session_type, location, notes }) {
    const startDate = new Date(start_time);
    const endDate = new Date(startDate.getTime() + config.session.duration * 60 * 1000);
    const bufferEndDate = new Date(startDate.getTime() + config.session.totalBlocked * 60 * 1000);

    // Check for overlapping appointments
    const existingAppointments = await db('appointments')
        .where({ therapist_id })
        .whereNot({ status: 'cancelled' })
        .select('id', 'start_time', 'buffer_end_time');

    if (hasOverlap(startDate, bufferEndDate, existingAppointments)) {
        const error = new Error('This time slot overlaps with an existing appointment. Please choose a different time.');
        error.statusCode = 409;
        throw error;
    }

    const [appointment] = await db('appointments')
        .insert({
            therapist_id,
            client_id,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            buffer_end_time: bufferEndDate.toISOString(),
            session_type,
            location: location || 'in-person',
            notes,
        })
        .returning('*');

    // Trigger Notifications Asynchronously
    (async () => {
        try {
            const client = await db('clients')
                .join('users', 'clients.user_id', 'users.id')
                .where('clients.id', client_id)
                .select('users.first_name', 'users.last_name', 'users.email', 'users.phone')
                .first();

            const therapist = await db('users')
                .where('id', therapist_id)
                .select('first_name', 'last_name', 'email')
                .first();

            if (client && therapist) {
                const notificationService = require('./notification.service');
                await Promise.all([
                    notificationService.sendAppointmentConfirmation(appointment, client, therapist),
                    notificationService.sendTherapistNotification(appointment, client, therapist)
                ]);
            }
        } catch (err) {
            console.error('[Notification Error] Failed to trigger appointment emails:', err.message);
        }
    })();

    return appointment;
}

/**
 * Reschedule an appointment.
 */
async function reschedule(appointmentId, newStartTime) {
    const appointment = await db('appointments').where({ id: appointmentId }).first();
    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.status === 'cancelled') {
        const error = new Error('Cannot reschedule a cancelled appointment.');
        error.statusCode = 400;
        throw error;
    }

    const startDate = new Date(newStartTime);
    const endDate = new Date(startDate.getTime() + config.session.duration * 60 * 1000);
    const bufferEndDate = new Date(startDate.getTime() + config.session.totalBlocked * 60 * 1000);

    // Check overlaps excluding current appointment
    const existingAppointments = await db('appointments')
        .where({ therapist_id: appointment.therapist_id })
        .whereNot({ status: 'cancelled' })
        .select('id', 'start_time', 'buffer_end_time');

    if (hasOverlap(startDate, bufferEndDate, existingAppointments, appointmentId)) {
        const error = new Error('The new time slot overlaps with an existing appointment.');
        error.statusCode = 409;
        throw error;
    }

    const [updated] = await db('appointments')
        .where({ id: appointmentId })
        .update({
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            buffer_end_time: bufferEndDate.toISOString(),
            updated_at: db.fn.now(),
        })
        .returning('*');

    return updated;
}

/**
 * Cancel an appointment.
 */
async function cancel(appointmentId, reason) {
    const [appointment] = await db('appointments')
        .where({ id: appointmentId })
        .update({
            status: 'cancelled',
            cancelled_reason: reason || null,
            updated_at: db.fn.now(),
        })
        .returning('*');

    if (!appointment) {
        const error = new Error('Appointment not found.');
        error.statusCode = 404;
        throw error;
    }

    return appointment;
}

/**
 * Get calendar data for a date range.
 */
async function getCalendar({ therapist_id, start_date, end_date }) {
    let query = db('appointments')
        .whereNot({ status: 'cancelled' })
        .where('start_time', '>=', start_date)
        .where('start_time', '<=', end_date)
        .leftJoin('clients', 'appointments.client_id', 'clients.id')
        .leftJoin('users as client_user', 'clients.user_id', 'client_user.id')
        .select(
            'appointments.*',
            'client_user.first_name as client_first_name',
            'client_user.last_name as client_last_name'
        )
        .orderBy('start_time', 'asc');

    if (therapist_id) {
        query = query.where('appointments.therapist_id', therapist_id);
    }

    return query;
}

module.exports = { getSlots, bookAppointment, reschedule, cancel, getCalendar };
