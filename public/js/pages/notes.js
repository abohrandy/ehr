/**
 * Session Notes Page — List, create, edit, lock, search, PDF export
 */
const NotesPage = (() => {
    async function render() {
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const clientId = params.get('client_id');
        const query = { page: 1, limit: 20 };
        if (clientId) query.client_id = clientId;

        const res = await API.get('/session-notes', query);
        const notes = res.data || [];
        const pagination = res.pagination || {};

        content.innerHTML = `
      <div class="fade-in-up">
        <div class="client-filters">
          <div class="search-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" class="form-control" id="notes-search" placeholder="Search notes...">
          </div>
          <select class="form-control" id="notes-type-filter" style="width:auto">
            <option value="">All Types</option>
            <option value="soap">SOAP</option>
            <option value="dap">DAP</option>
            <option value="progress">Progress</option>
          </select>
          <button class="btn btn-primary" onclick="NotesPage.showNewNoteModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            New Note
          </button>
        </div>

        <div class="note-cards-grid" id="notes-grid">
          ${notes.length === 0
                ? '<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg><h3>No session notes yet</h3><p>Create your first note to get started</p></div>'
                : notes.map(n => `
              <div class="note-card" onclick="NotesPage.viewNote('${n.id}')">
                <div class="note-card-header">
                  <h4>${NoteEditor.TEMPLATES[n.note_type]?.label || capitalize(n.note_type)}</h4>
                  <div style="display:flex;gap:6px;align-items:center">
                    ${n.is_locked ? '<span class="badge badge-warning">🔒 Locked</span>' : ''}
                    <span class="text-xs text-muted">${formatDateTime(n.created_at)}</span>
                  </div>
                </div>
                <p class="text-sm font-medium" style="margin-bottom:6px">${n.client_first_name || ''} ${n.client_last_name || ''}</p>
                <p class="note-preview">${n.subjective || n.data_section || n.intervention || 'No content'}</p>
              </div>
            `).join('')
            }
        </div>
        ${pagination.pages > 1 ? `<div class="text-center mt"><p class="text-sm text-muted">Page ${pagination.page} of ${pagination.pages} · ${pagination.total} notes total</p></div>` : ''}
      </div>
    `;

        // Search
        document.getElementById('notes-search').addEventListener('input', async (e) => {
            const search = e.target.value;
            if (search.length > 2 || search.length === 0) {
                const q = { ...query, search: search || undefined };
                const r = await API.get('/session-notes', q);
                updateNotesGrid(r.data || []);
            }
        });

        document.getElementById('notes-type-filter').addEventListener('change', async (e) => {
            const q = { ...query, note_type: e.target.value || undefined };
            const r = await API.get('/session-notes', q);
            updateNotesGrid(r.data || []);
        });

        // Auto-open new note
        if (params.get('new') === '1') showNewNoteModal();
    }

    function updateNotesGrid(notes) {
        const grid = document.getElementById('notes-grid');
        if (!grid) return;
        grid.innerHTML = notes.length === 0
            ? '<div class="empty-state" style="grid-column:1/-1"><h3>No notes found</h3></div>'
            : notes.map(n => `
        <div class="note-card" onclick="NotesPage.viewNote('${n.id}')">
          <div class="note-card-header">
            <h4>${NoteEditor.TEMPLATES[n.note_type]?.label || capitalize(n.note_type)}</h4>
            <div style="display:flex;gap:6px;align-items:center">
              ${n.is_locked ? '<span class="badge badge-warning">🔒 Locked</span>' : ''}
              <span class="text-xs text-muted">${formatDateTime(n.created_at)}</span>
            </div>
          </div>
          <p class="text-sm font-medium" style="margin-bottom:6px">${n.client_first_name || ''} ${n.client_last_name || ''}</p>
          <p class="note-preview">${n.subjective || n.data_section || n.intervention || 'No content'}</p>
        </div>
      `).join('');
    }

    function showNewNoteModal() {
        Modal.open({
            title: 'New Session Note',
            large: true,
            body: `
        <form id="new-note-form">
          <div class="form-row">
            <div class="form-group"><label>Client ID *</label><input class="form-control" name="client_id" required></div>
            <div class="form-group"><label>Note Type *</label>
              <select class="form-control" name="note_type" id="new-note-type">
                <option value="soap">SOAP</option>
                <option value="dap">DAP</option>
                <option value="progress">Progress</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Appointment ID (optional)</label><input class="form-control" name="appointment_id"></div>
          <div id="note-editor-area">${NoteEditor.render('soap')}</div>
        </form>
      `,
            footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="NotesPage.submitNote()">Save Note</button>',
        });

        document.getElementById('new-note-type').addEventListener('change', (e) => {
            document.getElementById('note-editor-area').innerHTML = NoteEditor.render(e.target.value);
        });
    }

    async function submitNote() {
        const form = document.getElementById('new-note-form');
        const fd = Object.fromEntries(new FormData(form));
        const editorData = NoteEditor.getData(document.getElementById('note-editor-area'));
        const data = { ...fd, ...editorData };
        if (!data.client_id) { Toast.error('Client ID is required.'); return; }

        const res = await API.post('/session-notes', data);
        if (res.success) {
            Toast.success('Note created!');
            Modal.close();
            render();
        } else {
            Toast.error(res.error || 'Failed to create note.');
        }
    }

    async function viewNote(id) {
        const res = await API.get(`/session-notes/${id}`);
        if (!res.success) { Toast.error('Note not found.'); return; }
        const n = res.data;

        Modal.open({
            title: `${NoteEditor.TEMPLATES[n.note_type]?.label || capitalize(n.note_type)} — ${n.client_first_name || ''} ${n.client_last_name || ''}`,
            large: true,
            body: `
        <div class="note-editor">
          <div class="note-editor-header">
            <div>
              <span class="badge badge-primary">${capitalize(n.note_type)}</span>
              <span class="text-sm text-muted" style="margin-left:10px">${formatDateTime(n.created_at)}</span>
            </div>
            ${n.is_locked ? '<span class="badge badge-warning">🔒 Locked</span>' : ''}
          </div>
          <div id="view-note-editor">${NoteEditor.render(n.note_type, n, n.is_locked)}</div>
        </div>
        ${n.edit_history && n.edit_history.length ? `
          <div class="mt"><h4 class="text-sm text-muted">Edit History</h4>
          ${(typeof n.edit_history === 'string' ? JSON.parse(n.edit_history) : n.edit_history).map(e => `<p class="text-xs text-muted">${formatDateTime(e.edited_at)} — Changed: ${e.changes?.join(', ')}</p>`).join('')}
          </div>
        ` : ''}
      `,
            footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
        <button class="btn btn-outline" onclick="NotesPage.exportPdf('${n.id}')">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Export PDF
        </button>
        ${!n.is_locked ? `
          <button class="btn btn-outline" onclick="NotesPage.saveNote('${n.id}')">Save Changes</button>
          <button class="btn btn-warning btn-sm" style="background:var(--warning);color:white" onclick="NotesPage.lockNote('${n.id}')">🔒 Lock Note</button>
        ` : ''}
      `,
        });
    }

    async function saveNote(id) {
        const data = NoteEditor.getData(document.getElementById('view-note-editor'));
        const res = await API.put(`/session-notes/${id}`, data);
        if (res.success) { Toast.success('Note updated!'); Modal.close(); render(); }
        else { Toast.error(res.error || 'Failed to update.'); }
    }

    async function lockNote(id) {
        if (!confirm('Are you sure? Locked notes cannot be edited.')) return;
        const res = await API.patch(`/session-notes/${id}/lock`);
        if (res.success) { Toast.success('Note locked.'); Modal.close(); render(); }
        else { Toast.error(res.error || 'Failed to lock.'); }
    }

    async function exportPdf(id) {
        const ok = await API.download(`/session-notes/${id}/pdf`, `session_note_${id}.pdf`);
        if (ok) Toast.success('PDF downloaded!');
        else Toast.error('PDF export failed.');
    }

    return { render, showNewNoteModal, submitNote, viewNote, saveNote, lockNote, exportPdf };
})();
