const config = require('../config');

/**
 * Parse a duration string like '15m', '7d', '1h' into milliseconds.
 */
function parseDuration(str) {
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // default 15 min
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 15 * 60 * 1000;
    }
}

/**
 * Generate available time slots for a given date, excluding booked intervals.
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {Array} bookedSlots - Array of { start_time, buffer_end_time }
 * @param {number} slotDuration - Duration in minutes (default 60 = session + buffer)
 * @returns {Array} Available slots as { start, end }
 */
function getAvailableSlots(date, bookedSlots, slotDuration = config.session.totalBlocked) {
    const { start: workStart, end: workEnd } = config.workingHours;
    const slots = [];

    // Generate all possible slots in the working hours
    for (let hour = workStart; hour < workEnd; hour++) {
        for (let min = 0; min < 60; min += slotDuration) {
            if (hour + (min + slotDuration) / 60 > workEnd) continue;

            const slotStart = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`);
            const slotEnd = new Date(slotStart.getTime() + config.session.duration * 60 * 1000);
            const bufferEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

            // Check if this slot overlaps with any booked slot
            const isOverlapping = bookedSlots.some((booked) => {
                const bookedStart = new Date(booked.start_time);
                const bookedBufferEnd = new Date(booked.buffer_end_time);
                return slotStart < bookedBufferEnd && bufferEnd > bookedStart;
            });

            if (!isOverlapping) {
                slots.push({
                    start_time: slotStart.toISOString(),
                    end_time: slotEnd.toISOString(),
                    buffer_end_time: bufferEnd.toISOString(),
                });
            }
        }
    }

    return slots;
}

/**
 * Check if a proposed appointment overlaps with existing appointments.
 * @param {Date} startTime
 * @param {Date} bufferEndTime
 * @param {Array} existingAppointments - Array of { start_time, buffer_end_time }
 * @param {string|null} excludeId - Appointment ID to exclude (for rescheduling)
 * @returns {boolean}
 */
function hasOverlap(startTime, bufferEndTime, existingAppointments, excludeId = null) {
    return existingAppointments.some((appt) => {
        if (excludeId && appt.id === excludeId) return false;
        const apptStart = new Date(appt.start_time);
        const apptBufferEnd = new Date(appt.buffer_end_time);
        return startTime < apptBufferEnd && bufferEndTime > apptStart;
    });
}

module.exports = {
    parseDuration,
    getAvailableSlots,
    hasOverlap,
};
