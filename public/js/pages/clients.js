/**
 * Clients Page — CRUD, family linking, profile view
 */
const ClientsPage = (() => {
  async function render() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    const res = await API.get('/clients');
    const clients = res.data || [];

    content.innerHTML = `
      <div class="fade-in-up">
        <div class="client-filters">
          <div class="search-input">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" class="form-control" id="client-search" placeholder="Search clients...">
          </div>
          <select class="form-control" id="client-filter-type" style="width:auto">
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="couple">Couple</option>
            <option value="family">Family</option>
            <option value="child">Child</option>
          </select>
          <select class="form-control" id="client-filter-status" style="width:auto">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discharged">Discharged</option>
          </select>
          <button class="btn btn-primary" onclick="ClientsPage.showNewClientModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Add Client
          </button>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table class="data-table" id="clients-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Intake Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${clients.map(c => `
                  <tr data-name="${(c.first_name + ' ' + c.last_name).toLowerCase()}" data-type="${c.case_type || ''}" data-status="${c.status || ''}">
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:34px;height:34px;border-radius:50%;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.75rem">${(c.first_name?.[0] || '') + (c.last_name?.[0] || '')}</div>
                        <div><strong>${c.first_name || ''} ${c.last_name || ''}</strong></div>
                      </div>
                    </td>
                    <td>${c.email || ''}</td>
                    <td><span class="badge badge-primary">${capitalize(c.case_type || 'individual')}</span></td>
                    <td><span class="badge badge-${c.status === 'active' ? 'success' : c.status === 'discharged' ? 'muted' : 'warning'}">${capitalize(c.status || 'active')}</span></td>
                    <td class="text-sm text-muted">${c.intake_date ? new Date(c.intake_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <button class="btn btn-ghost btn-sm" onclick="ClientsPage.viewClient('${c.id}')">View</button>
                      <button class="btn btn-ghost btn-sm" onclick="ClientsPage.showLinkModal('${c.id}')">Link</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Search filter
    document.getElementById('client-search').addEventListener('input', filterClients);
    document.getElementById('client-filter-type').addEventListener('change', filterClients);
    document.getElementById('client-filter-status').addEventListener('change', filterClients);

    // Auto-open new client modal
    if (window.location.hash.includes('new=1')) showNewClientModal();
  }

  function filterClients() {
    const search = document.getElementById('client-search').value.toLowerCase();
    const type = document.getElementById('client-filter-type').value;
    const status = document.getElementById('client-filter-status').value;
    const rows = document.querySelectorAll('#clients-table tbody tr');
    rows.forEach(row => {
      const name = row.dataset.name || '';
      const rType = row.dataset.type || '';
      const rStatus = row.dataset.status || '';
      const show = name.includes(search) && (!type || rType === type) && (!status || rStatus === status);
      row.style.display = show ? '' : 'none';
    });
  }

  function showNewClientModal() {
    Modal.open({
      title: 'New Client',
      body: `
        <form id="new-client-form">
          <div class="form-row">
            <div class="form-group"><label>First Name *</label><input class="form-control" name="first_name" required></div>
            <div class="form-group"><label>Last Name *</label><input class="form-control" name="last_name" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Email *</label><input class="form-control" type="email" name="email" required></div>
            <div class="form-group"><label>Password *</label><input class="form-control" type="password" name="password" required minlength="8"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Phone</label><input class="form-control" name="phone"></div>
            <div class="form-group"><label>Date of Birth</label><input class="form-control" type="date" name="date_of_birth"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Gender</label>
              <select class="form-control" name="gender"><option value="">Select</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Other</option><option>Prefer not to say</option></select>
            </div>
            <div class="form-group"><label>Case Type</label>
              <select class="form-control" name="case_type"><option value="individual">Individual</option><option value="couple">Couple</option><option value="family">Family</option><option value="child">Child</option></select>
            </div>
          </div>
          <div class="form-group"><label>Address</label><input class="form-control" name="address"></div>
          <div class="form-row">
            <div class="form-group"><label>Emergency Contact</label><input class="form-control" name="emergency_contact_name"></div>
            <div class="form-group"><label>Emergency Phone</label><input class="form-control" name="emergency_contact_phone"></div>
          </div>
        </form>
      `,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="ClientsPage.submitNewClient()">Create Client</button>',
    });
  }

  async function submitNewClient() {
    const form = document.getElementById('new-client-form');
    const data = Object.fromEntries(new FormData(form));
    if (!data.first_name || !data.last_name || !data.email || !data.password) {
      Toast.error('Please fill in all required fields.');
      return;
    }
    const res = await API.post('/clients', data);
    if (res.success) {
      Toast.success('Client created successfully!');
      Modal.close();
      render();
    } else {
      Toast.error(res.error || 'Failed to create client.');
    }
  }

  async function viewClient(id) {
    const res = await API.get(`/clients/${id}`);
    if (!res.success) { Toast.error('Client not found.'); return; }
    const c = res.data;
    const relRes = await API.get(`/clients/${id}/relationships`);
    const rels = relRes.data || [];

    Modal.open({
      title: `${c.first_name} ${c.last_name}`,
      large: true,
      body: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <p class="text-sm text-muted">Email</p><p class="font-medium">${c.email || '—'}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Phone</p><p class="font-medium">${c.phone || '—'}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Case Type</p><p><span class="badge badge-primary">${capitalize(c.case_type)}</span></p>
          </div>
          <div>
            <p class="text-sm text-muted">Status</p><p><span class="badge badge-${c.status === 'active' ? 'success' : 'muted'}">${capitalize(c.status)}</span></p>
          </div>
          <div>
            <p class="text-sm text-muted">Date of Birth</p><p class="font-medium">${c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Gender</p><p class="font-medium">${c.gender || '—'}</p>
          </div>
          <div style="grid-column:1/-1">
            <p class="text-sm text-muted">Address</p><p class="font-medium">${c.address || '—'}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Emergency Contact</p><p class="font-medium">${c.emergency_contact_name || '—'} ${c.emergency_contact_phone ? '(' + c.emergency_contact_phone + ')' : ''}</p>
          </div>
          <div>
            <p class="text-sm text-muted">Intake Date</p><p class="font-medium">${c.intake_date ? new Date(c.intake_date).toLocaleDateString() : '—'}</p>
          </div>
        </div>
        ${rels.length ? `
          <h4 style="margin-top:20px;margin-bottom:10px">Family Links</h4>
          ${rels.map(r => `<div class="appt-item"><span class="badge badge-info">${capitalize(r.relationship_type)}</span><span class="font-medium" style="margin-left:8px">${r.related_client?.first_name || ''} ${r.related_client?.last_name || ''}</span></div>`).join('')}
        ` : ''}
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
        <button class="btn btn-outline" onclick="window.location.hash='#/notes?client_id=${id}';Modal.close()">View Notes</button>
        <button class="btn btn-outline" onclick="window.location.hash='#/plans?client_id=${id}';Modal.close()">View Plans</button>
      `,
    });
  }

  async function showLinkModal(clientId) {
    // Show loading state first
    Modal.open({
      title: 'Link Family Member',
      body: `<div class="loading-spinner"><div class="spinner"></div></div>`,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>'
    });

    const res = await API.get('/clients');
    const clients = (res.data || []).filter(c => c.id !== clientId);

    Modal.open({
      title: 'Link Family Member',
      body: `
        <form id="link-form">
          <input type="hidden" name="client_id_1" value="${clientId}">
          <div class="form-group">
            <label>Select Family Member *</label>
            <select class="form-control" name="client_id_2" required>
                <option value="">Select a client...</option>
                ${clients.map(c => `<option value="${c.id}">${c.first_name} ${c.last_name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Relationship Type</label>
            <select class="form-control" name="relationship_type">
              <option value="spouse">Spouse</option>
              <option value="partner">Partner</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="guardian">Guardian</option>
              <option value="other">Other</option>
            </select>
          </div>
        </form>
      `,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="ClientsPage.submitLink()">Link</button>',
    });
  }

  async function submitLink() {
    const form = document.getElementById('link-form');
    const fd = Object.fromEntries(new FormData(form));
    if (!fd.client_id_2) { Toast.error('Please select a family member.'); return; }
    const res = await API.post('/clients/link', fd);
    if (res.success) {
      Toast.success('Family link created!');
      Modal.close();
    } else {
      Toast.error(res.error || 'Failed to create link.');
    }
  }

  return { render, showNewClientModal, submitNewClient, viewClient, showLinkModal, submitLink };
})();
