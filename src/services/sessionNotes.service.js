const db = require('../db/knex');

/**
 * Create a session note.
 */
async function createNote(therapistId, data) {
    const [note] = await db('session_notes')
        .insert({
            ...data,
            therapist_id: therapistId,
            edit_history: JSON.stringify([]),
        })
        .returning('*');

    return note;
}

/**
 * List/search session notes.
 */
async function listNotes({ client_id, note_type, search, start_date, end_date, page, limit }, therapistId, role) {
    let query = db('session_notes')
        .leftJoin('clients', 'session_notes.client_id', 'clients.id')
        .leftJoin('users as client_user', 'clients.user_id', 'client_user.id')
        .select(
            'session_notes.*',
            'client_user.first_name as client_first_name',
            'client_user.last_name as client_last_name'
        );

    // Role-based filtering
    if (role === 'therapist') {
        query = query.where('session_notes.therapist_id', therapistId);
    }

    if (client_id) query = query.where('session_notes.client_id', client_id);
    if (note_type) query = query.where('session_notes.note_type', note_type);
    if (start_date) query = query.where('session_notes.created_at', '>=', start_date);
    if (end_date) query = query.where('session_notes.created_at', '<=', end_date);

    if (search) {
        query = query.where(function () {
            this.where('session_notes.subjective', 'ilike', `%${search}%`)
                .orWhere('session_notes.objective', 'ilike', `%${search}%`)
                .orWhere('session_notes.assessment_section', 'ilike', `%${search}%`)
                .orWhere('session_notes.plan_section', 'ilike', `%${search}%`)
                .orWhere('session_notes.data_section', 'ilike', `%${search}%`)
                .orWhere('session_notes.intervention', 'ilike', `%${search}%`);
        });
    }

    const offset = (page - 1) * limit;
    const total = await query.clone().count('* as count').first();
    const notes = await query.orderBy('session_notes.created_at', 'desc').offset(offset).limit(limit);

    return {
        data: notes,
        pagination: {
            page,
            limit,
            total: parseInt(total.count, 10),
            pages: Math.ceil(parseInt(total.count, 10) / limit),
        },
    };
}

/**
 * Get a single note by ID.
 */
async function getNoteById(noteId) {
    const note = await db('session_notes')
        .leftJoin('clients', 'session_notes.client_id', 'clients.id')
        .leftJoin('users as client_user', 'clients.user_id', 'client_user.id')
        .leftJoin('users as therapist_user', 'session_notes.therapist_id', 'therapist_user.id')
        .select(
            'session_notes.*',
            'client_user.first_name as client_first_name',
            'client_user.last_name as client_last_name',
            'therapist_user.first_name as therapist_first_name',
            'therapist_user.last_name as therapist_last_name'
        )
        .where('session_notes.id', noteId)
        .first();

    if (!note) {
        const error = new Error('Session note not found.');
        error.statusCode = 404;
        throw error;
    }

    return note;
}

/**
 * Update a session note (if not locked).
 */
async function updateNote(noteId, data, userId) {
    const note = await db('session_notes').where({ id: noteId }).first();

    if (!note) {
        const error = new Error('Session note not found.');
        error.statusCode = 404;
        throw error;
    }

    if (note.is_locked) {
        const error = new Error('This note is locked and cannot be edited.');
        error.statusCode = 403;
        throw error;
    }

    // Track edit history
    const editHistory = note.edit_history || [];
    editHistory.push({
        edited_by: userId,
        edited_at: new Date().toISOString(),
        changes: Object.keys(data),
    });

    const [updated] = await db('session_notes')
        .where({ id: noteId })
        .update({
            ...data,
            edit_history: JSON.stringify(editHistory),
            updated_at: db.fn.now(),
        })
        .returning('*');

    return updated;
}

/**
 * Lock a session note.
 */
async function lockNote(noteId, userId) {
    const note = await db('session_notes').where({ id: noteId }).first();

    if (!note) {
        const error = new Error('Session note not found.');
        error.statusCode = 404;
        throw error;
    }

    if (note.is_locked) {
        const error = new Error('Note is already locked.');
        error.statusCode = 400;
        throw error;
    }

    const [locked] = await db('session_notes')
        .where({ id: noteId })
        .update({
            is_locked: true,
            locked_at: db.fn.now(),
            locked_by: userId,
            updated_at: db.fn.now(),
        })
        .returning('*');

    return locked;
}

module.exports = { createNote, listNotes, getNoteById, updateNote, lockNote };
