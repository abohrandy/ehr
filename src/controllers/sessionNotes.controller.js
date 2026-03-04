const notesService = require('../services/sessionNotes.service');
const { generateSessionNotePDF } = require('../utils/pdfGenerator');

async function create(req, res, next) {
    try {
        const note = await notesService.createNote(req.user.id, req.body);
        res.status(201).json({ success: true, data: note });
    } catch (err) { next(err); }
}

async function list(req, res, next) {
    try {
        const result = await notesService.listNotes(req.query, req.user.id, req.user.role);
        res.json({ success: true, ...result });
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const note = await notesService.getNoteById(req.params.id);
        res.json({ success: true, data: note });
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const note = await notesService.updateNote(req.params.id, req.body, req.user.id);
        res.json({ success: true, data: note });
    } catch (err) { next(err); }
}

async function lock(req, res, next) {
    try {
        const note = await notesService.lockNote(req.params.id, req.user.id);
        res.json({ success: true, data: note, message: 'Note locked successfully.' });
    } catch (err) { next(err); }
}

async function exportPdf(req, res, next) {
    try {
        const note = await notesService.getNoteById(req.params.id);

        // Add readable names
        note.client_name = `${note.client_first_name || ''} ${note.client_last_name || ''}`.trim();
        note.therapist_name = `${note.therapist_first_name || ''} ${note.therapist_last_name || ''}`.trim();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=session_note_${note.id}.pdf`);

        const pdfDoc = generateSessionNotePDF(note);
        pdfDoc.pipe(res);
    } catch (err) { next(err); }
}

module.exports = { create, list, getById, update, lock, exportPdf };
