/**
 * Client Portal — Book sessions, view appointments, send messages, upload documents
 */
const PortalPage = (() => {
    let portalView = 'home'; // home, appointments, messages

    async function render() {
        const content = document.getElementById('content-area');
        const user = Auth.getUser();
        const hash = window.location.hash;

        if (hash.includes('/portal/appointments')) portalView = 'appointments';
        else if (hash.includes('/portal/messages')) portalView = 'messages';
        else portalView = 'home';

        if (portalView === 'home') renderHome(content, user);
        else if (portalView === 'appointments') renderAppointments(content);
        else if (portalView === 'messages') renderMessages(content);
    }

    function renderHome(content, user) {
        content.innerHTML = `
      <div class="fade-in-up">
        <div class="portal-welcome">
          <h2>Welcome back, ${user?.first_name || 'there'}!</h2>
          <p>Manage your therapy journey from one place.</p>
        </div>
        <div class="portal-grid">
          <div class="portal-card" onclick="window.location.hash='#/portal/appointments'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <h4>My Appointments</h4>
            <p>View upcoming and past sessions</p>
          </div>
          <div class="portal-card" onclick="PortalPage.showBookModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="10"/></svg>
            <h4>Book a Session</h4>
            <p>Schedule your next appointment</p>
          </div>
          <div class="portal-card" onclick="window.location.hash='#/portal/messages'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <h4>Messages</h4>
            <p>Communicate securely with your therapist</p>
          </div>
          <div class="portal-card" onclick="PortalPage.showUploadModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <h4>Upload Documents</h4>
            <p>Share forms and documents</p>
          </div>
        </div>
      </div>
    `;
    }

    async function renderAppointments(content) {
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        const res = await API.get('/appointments');
        const appointments = res.data || [];
        const now = new Date().toISOString();
        const upcoming = appointments.filter(a => a.start_time > now && a.status === 'scheduled');
        const past = appointments.filter(a => a.start_time <= now || a.status === 'completed');

        content.innerHTML = `
      <div class="fade-in-up">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <button class="btn btn-ghost" onclick="window.location.hash='#/portal'">← Back to Portal</button>
          <button class="btn btn-primary" onclick="PortalPage.showBookModal()">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Book Session
          </button>
        </div>

        <h3 style="margin-bottom:14px">Upcoming Sessions</h3>
        ${upcoming.length === 0
                ? '<div class="card"><div class="card-body"><div class="empty-state" style="padding:30px"><p>No upcoming sessions</p></div></div></div>'
                : `<div class="card"><div class="card-body">${upcoming.map(a => `
              <div class="appt-item">
                <div class="appt-time">${formatDate(a.start_time)}<br><small>${formatTime(a.start_time)}</small></div>
                <div class="appt-info">
                  <div class="appt-name">${capitalize(a.session_type)} Session</div>
                  <div class="appt-type">${capitalize(a.location)} · 45 min</div>
                </div>
                <span class="badge badge-info">Scheduled</span>
              </div>
            `).join('')}</div></div>`
            }

        <h3 style="margin:24px 0 14px">Past Sessions</h3>
        ${past.length === 0
                ? '<div class="card"><div class="card-body"><div class="empty-state" style="padding:30px"><p>No past sessions</p></div></div></div>'
                : `<div class="card"><div class="card-body">${past.slice(0, 10).map(a => `
              <div class="appt-item">
                <div class="appt-time">${formatDate(a.start_time)}<br><small>${formatTime(a.start_time)}</small></div>
                <div class="appt-info">
                  <div class="appt-name">${capitalize(a.session_type)} Session</div>
                  <div class="appt-type">${capitalize(a.location)}</div>
                </div>
                <span class="badge badge-${a.status === 'completed' ? 'success' : 'muted'}">${capitalize(a.status)}</span>
              </div>
            `).join('')}</div></div>`
            }
      </div>
    `;
    }

    async function renderMessages(content) {
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        const res = await API.get('/messages/conversations');
        const conversations = res.data || [];

        content.innerHTML = `
      <div class="fade-in-up">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <button class="btn btn-ghost" onclick="window.location.hash='#/portal'">← Back to Portal</button>
          <button class="btn btn-primary btn-sm" onclick="PortalPage.showNewMessageModal()">New Message</button>
        </div>

        <div class="card">
          <div class="card-header"><h3>Conversations</h3></div>
          <div class="message-list">
            ${conversations.length === 0
                ? '<div class="empty-state" style="padding:40px"><p>No messages yet. Start a conversation with your therapist.</p></div>'
                : conversations.map(c => `
                <div class="message-item ${c.unread ? 'unread' : ''}" onclick="PortalPage.openConversation('${c.id}')">
                  <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.8rem">${(c.other_party_name || 'T')[0]}</div>
                  <div style="flex:1;min-width:0">
                    <div style="display:flex;justify-content:space-between"><strong class="text-sm">${c.other_party_name || 'Therapist'}</strong><span class="text-xs text-muted">${formatDateTime(c.last_message_at)}</span></div>
                    <p class="text-sm text-muted truncate">${c.last_message || 'No messages'}</p>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    `;
    }

    async function openConversation(convId) {
        const res = await API.get(`/messages/conversations/${convId}`);
        const messages = res.data || [];
        const user = Auth.getUser();

        Modal.open({
            title: 'Conversation',
            large: true,
            body: `
        <div class="chat-area">
          <div class="chat-messages" id="chat-messages">
            ${messages.map(m => `
              <div class="chat-bubble ${m.sender_id === user?.id ? 'sent' : 'received'}">
                ${m.content || m.decrypted_content || ''}
                <div class="text-xs" style="opacity:0.7;margin-top:4px">${formatTime(m.created_at)}</div>
              </div>
            `).join('')}
          </div>
          <div class="chat-input-area">
            <input class="form-control" id="chat-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')PortalPage.sendMessage('${convId}')">
            <button class="btn btn-primary" onclick="PortalPage.sendMessage('${convId}')">Send</button>
          </div>
        </div>
      `,
            footer: '',
        });

        // Scroll to bottom
        setTimeout(() => {
            const chatEl = document.getElementById('chat-messages');
            if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
        }, 100);
    }

    async function sendMessage(convId) {
        const input = document.getElementById('chat-input');
        const content = input?.value?.trim();
        if (!content) return;
        const res = await API.post('/messages', { recipient_id: convId, content });
        if (res.success) {
            input.value = '';
            // Re-open to refresh
            openConversation(convId);
        } else {
            Toast.error(res.error || 'Failed to send.');
        }
    }

    function showBookModal() {
        const user = Auth.getUser();
        Modal.open({
            title: 'Book a Session',
            body: `
        <form id="portal-book-form">
          <div class="form-row">
            <div class="form-group"><label>Date *</label><input class="form-control" type="date" name="date" required min="${new Date().toISOString().split('T')[0]}"></div>
            <div class="form-group"><label>Preferred Time *</label><input class="form-control" type="time" name="time" required value="10:00"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Session Type</label>
              <select class="form-control" name="session_type"><option value="individual">Individual</option><option value="couple">Couple</option><option value="family">Family</option></select>
            </div>
            <div class="form-group"><label>Location</label>
              <select class="form-control" name="location"><option value="in-person">In-Person</option><option value="telehealth">Telehealth</option></select>
            </div>
          </div>
          <div class="form-group"><label>Notes</label><textarea class="form-control" name="notes" rows="2" placeholder="Anything you'd like to share..."></textarea></div>
        </form>
        <div style="background:var(--primary-bg);padding:12px;border-radius:8px">
          <p class="text-sm" style="color:var(--primary)">Sessions are 45 minutes. You'll receive a confirmation once booked.</p>
        </div>
      `,
            footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="PortalPage.submitBooking()">Request Booking</button>',
        });
    }

    async function submitBooking() {
        const form = document.getElementById('portal-book-form');
        const fd = Object.fromEntries(new FormData(form));
        if (!fd.date || !fd.time) { Toast.error('Date and time are required.'); return; }
        const user = Auth.getUser();
        const startTime = new Date(`${fd.date}T${fd.time}:00`).toISOString();
        const res = await API.post('/appointments', {
            client_id: user?.client_id || user?.id,
            start_time: startTime,
            session_type: fd.session_type,
            location: fd.location,
            notes: fd.notes,
        });
        if (res.success) { Toast.success('Booking request sent!'); Modal.close(); }
        else { Toast.error(res.error || 'Booking failed.'); }
    }

    function showUploadModal() {
        Modal.open({
            title: 'Upload Document',
            body: `
        <div class="form-group">
          <label>Select File</label>
          <input type="file" class="form-control" id="portal-file-input" accept=".pdf,.doc,.docx,.jpg,.png">
        </div>
        <p class="text-sm text-muted">Accepted: PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
      `,
            footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="PortalPage.submitUpload()">Upload</button>',
        });
    }

    async function submitUpload() {
        const input = document.getElementById('portal-file-input');
        if (!input?.files?.length) { Toast.error('Please select a file.'); return; }
        const res = await API.upload('/messages/upload', input.files[0]);
        if (res.success) { Toast.success('Document uploaded!'); Modal.close(); }
        else { Toast.error(res.error || 'Upload failed.'); }
    }

    function showNewMessageModal() {
        Modal.open({
            title: 'New Message',
            body: `
        <form id="new-msg-form">
          <div class="form-group"><label>Recipient ID *</label><input class="form-control" name="recipient_id" placeholder="Therapist ID" required></div>
          <div class="form-group"><label>Message *</label><textarea class="form-control" name="content" rows="4" placeholder="Type your message..." required></textarea></div>
        </form>
      `,
            footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="PortalPage.submitNewMessage()">Send</button>',
        });
    }

    async function submitNewMessage() {
        const form = document.getElementById('new-msg-form');
        const data = Object.fromEntries(new FormData(form));
        if (!data.recipient_id || !data.content) { Toast.error('All fields required.'); return; }
        const res = await API.post('/messages', data);
        if (res.success) { Toast.success('Message sent!'); Modal.close(); renderMessages(document.getElementById('content-area')); }
        else { Toast.error(res.error || 'Failed to send.'); }
    }

    return { render, showBookModal, submitBooking, showUploadModal, submitUpload, openConversation, sendMessage, showNewMessageModal, submitNewMessage };
})();
