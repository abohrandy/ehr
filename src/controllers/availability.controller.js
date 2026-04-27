const db = require('../db/knex');

async function setAvailability(req, res, next) {
    try {
        let therapist_id = req.user.id;
        if (req.params.therapist_id && req.params.therapist_id !== req.user.id) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Unauthorized to set availability for other users.' });
            }
            therapist_id = req.params.therapist_id;
        }

        const { availability, breaks } = req.body;

        await db.transaction(async trx => {
            // Update availability rules
            if (availability && Array.isArray(availability)) {
                for (const item of availability) {
                    const { day_of_week, start_time, end_time, session_duration, buffer_duration, min_advance_hours, max_sessions_per_day } = item;

                    const existing = await trx('therapist_availability')
                        .where({ therapist_id, day_of_week })
                        .first();

                    if (existing) {
                        await trx('therapist_availability')
                            .where({ id: existing.id })
                            .update({
                                start_time,
                                end_time,
                                session_duration: session_duration || 45,
                                buffer_duration: buffer_duration || 15,
                                min_advance_hours: min_advance_hours || 4,
                                max_sessions_per_day,
                                updated_at: db.fn.now()
                            });
                    } else {
                        await trx('therapist_availability').insert({
                            therapist_id,
                            day_of_week,
                            start_time,
                            end_time,
                            session_duration: session_duration || 45,
                            buffer_duration: buffer_duration || 15,
                            min_advance_hours: min_advance_hours || 4,
                            max_sessions_per_day
                        });
                    }
                }
            }

            // Update breaks
            if (breaks && Array.isArray(breaks)) {
                // For simplicity, we'll replace existing breaks with new ones
                await trx('therapist_breaks').where({ therapist_id }).delete();
                for (const b of breaks) {
                    await trx('therapist_breaks').insert({
                        therapist_id,
                        break_type: b.break_type,
                        start_time: b.start_time,
                        end_time: b.end_time,
                        days_of_week: b.days_of_week
                    });
                }
            }
        });

        res.json({ success: true, message: 'Availability updated successfully.' });
    } catch (err) { next(err); }
}

async function getAvailability(req, res, next) {
    try {
        const therapist_id = req.params.therapist_id || req.user.id;
        const availability = await db('therapist_availability').where({ therapist_id }).orderBy('day_of_week', 'asc');
        const breaks = await db('therapist_breaks').where({ therapist_id });
        res.json({ success: true, data: { availability, breaks } });
    } catch (err) { next(err); }
}

async function getAvailableSlots(req, res, next) {
    try {
        const { therapist_id, date } = req.query;
        if (!therapist_id || !date) {
            return res.status(400).json({ success: false, error: 'Therapist ID and date are required.' });
        }

        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();

        // 1. Fetch Therapist Rules
        const rule = await db('therapist_availability')
            .where({ therapist_id, day_of_week: dayOfWeek })
            .first();

        if (!rule) {
            return res.json({ success: true, data: [], message: 'No working hours configured for this day.' });
        }

        // 2. Fetch Breaks
        const breaks = await db('therapist_breaks')
            .where({ therapist_id })
            .where(function () {
                this.whereNull('days_of_week').orWhere('days_of_week', 'like', `%${dayOfWeek}%`);
            });

        // 3. Fetch Existing Appointments
        const appointments = await db('appointments')
            .where({ therapist_id, status: 'confirmed' })
            .whereRaw('DATE(start_time) = ?', [date]);

        // 4. Calculate Slots
        const slots = [];
        const sessionTotal = rule.session_duration + rule.buffer_duration;

        let currentTime = new Date(`${date}T${rule.start_time}`);
        const endTime = new Date(`${date}T${rule.end_time}`);
        const now = new Date();
        const minBookingTime = new Date(now.getTime() + (rule.min_advance_hours * 60 * 60 * 1000));

        while (new Date(currentTime.getTime() + rule.session_duration * 60000) <= endTime) {
            const slotStart = new Date(currentTime);
            const slotEnd = new Date(currentTime.getTime() + rule.session_duration * 60000);
            const slotTotalEnd = new Date(currentTime.getTime() + sessionTotal * 60000);

            // Check if slot is in the future + min advance window
            if (slotStart < minBookingTime) {
                currentTime = new Date(slotTotalEnd);
                continue;
            }

            // Check against Breaks
            const isBreak = breaks.some(b => {
                const bStart = new Date(`${date}T${b.start_time}`);
                const bEnd = new Date(`${date}T${b.end_time}`);
                return (slotStart < bEnd && slotEnd > bStart);
            });

            if (isBreak) {
                currentTime = new Date(slotTotalEnd);
                continue;
            }

            // Check against Appointments
            const isBooked = appointments.some(a => {
                const aStart = new Date(a.start_time);
                // Assume appointments also block their total duration including buffer context if applicable
                // For simplicity, we check if the slot overlaps with any confirmed appointment start_time
                // In a real system, you'd check slotStart < aEnd && slotEnd > aStart
                // We'll use a fixed 60m block for existing appointments since that's our current logic
                const aEnd = new Date(aStart.getTime() + 60 * 60000);
                return (slotStart < aEnd && slotEnd > aStart);
            });

            if (isBooked) {
                currentTime = new Date(slotTotalEnd);
                continue;
            }

            slots.push({
                start_time: slotStart.toISOString(),
                end_time: slotEnd.toISOString(),
                display_time: slotStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            });

            currentTime = new Date(slotTotalEnd);
        }

        // 5. Daily Limit Check (Enforced during booking, but nice to know here)
        if (rule.max_sessions_per_day && appointments.length >= rule.max_sessions_per_day) {
            return res.json({ success: true, data: [], message: 'Daily session limit reached.' });
        }

        res.json({ success: true, data: slots });

    } catch (err) { next(err); }
}

module.exports = { setAvailability, getAvailability, getAvailableSlots };
