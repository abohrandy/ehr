const PDFDocument = require('pdfkit');

/**
 * Generate a PDF document from session note data.
 * @param {Object} note - Session note object
 * @returns {PDFDocument} Pipeable PDF stream
 */
function generateSessionNotePDF(note) {
    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Futurology Global Therapists', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Session Note Report', { align: 'center' });
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Meta info
    doc.fontSize(10).font('Helvetica-Bold').text('Note Type: ', { continued: true });
    doc.font('Helvetica').text((note.note_type || '').toUpperCase());

    doc.font('Helvetica-Bold').text('Date: ', { continued: true });
    doc.font('Helvetica').text(new Date(note.created_at).toLocaleDateString());

    if (note.client_name) {
        doc.font('Helvetica-Bold').text('Client: ', { continued: true });
        doc.font('Helvetica').text(note.client_name);
    }

    if (note.therapist_name) {
        doc.font('Helvetica-Bold').text('Therapist: ', { continued: true });
        doc.font('Helvetica').text(note.therapist_name);
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Content based on note type
    if (note.note_type === 'soap') {
        addSection(doc, 'Subjective', note.subjective);
        addSection(doc, 'Objective', note.objective);
        addSection(doc, 'Assessment', note.assessment_section);
        addSection(doc, 'Plan', note.plan_section);
    } else if (note.note_type === 'dap') {
        addSection(doc, 'Data', note.data_section);
        addSection(doc, 'Assessment', note.assessment_section);
        addSection(doc, 'Plan', note.plan_section);
    } else if (note.note_type === 'progress') {
        addSection(doc, 'Subjective', note.subjective);
        addSection(doc, 'Intervention', note.intervention);
        addSection(doc, 'Objective', note.objective);
        addSection(doc, 'Plan', note.plan_section);
    }

    // Lock status
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(8).fillColor('gray').text(
        note.is_locked ? `Locked on ${new Date(note.locked_at).toLocaleString()}` : 'Note is not locked',
        { align: 'right' }
    );

    // Footer
    doc.fontSize(8).fillColor('gray').text(
        `Generated on ${new Date().toLocaleString()} | Confidential`,
        50,
        doc.page.height - 50,
        { align: 'center' }
    );

    doc.end();
    return doc;
}

function addSection(doc, title, content) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('black').text(title);
    doc.fontSize(10).font('Helvetica').text(content || 'N/A');
    doc.moveDown();
}

module.exports = { generateSessionNotePDF };
