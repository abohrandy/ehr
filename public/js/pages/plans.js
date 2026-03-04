/**
 * Treatment Plans Page — Goal tracking, progress, status
 */
const PlansPage = (() => {
  async function render() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const clientId = params.get('client_id');
    const query = {};
    if (clientId) query.client_id = clientId;

    const res = await API.get('/treatment-plans', query);
    const plans = res.data || [];

    content.innerHTML = `
      <div class="fade-in-up">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div class="tabs" style="margin-bottom:0;border:none">
            <button class="tab-btn active" onclick="PlansPage.filterPlans('all',this)">All</button>
            <button class="tab-btn" onclick="PlansPage.filterPlans('active',this)">Active</button>
            <button class="tab-btn" onclick="PlansPage.filterPlans('completed',this)">Completed</button>
            <button class="tab-btn" onclick="PlansPage.filterPlans('closed',this)">Closed</button>
          </div>
          <button class="btn btn-primary" onclick="PlansPage.showNewPlanModal()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            New Plan
          </button>
        </div>

        <div id="plans-list">
          ${plans.length === 0
        ? '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg><h3>No treatment plans</h3><p>Create a treatment plan to start tracking goals</p></div>'
        : plans.map(p => renderPlanCard(p)).join('')
      }
        </div>
      </div>
    `;

    if (params.get('new') === '1') showNewPlanModal();
  }

  function renderPlanCard(p) {
    const goals = typeof p.goals === 'string' ? JSON.parse(p.goals) : (p.goals || []);
    const progress = typeof p.progress_notes === 'string' ? JSON.parse(p.progress_notes) : (p.progress_notes || []);
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    return `
      <div class="card mb" data-status="${p.status}" style="cursor:pointer" onclick="PlansPage.viewPlan('${p.id}')">
        <div class="card-header">
          <div>
            <h3 style="margin-bottom:4px">${p.client_first_name || ''} ${p.client_last_name || ''}</h3>
            <div style="display:flex;gap:8px;align-items:center">
              <span class="badge badge-${p.status === 'active' ? 'success' : p.status === 'completed' ? 'info' : 'muted'}">${capitalize(p.status)}</span>
              <span class="badge badge-primary">${capitalize(p.case_type || 'individual')}</span>
              <span class="text-xs text-muted">${goals.length} goals · ${completedGoals} completed</span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-muted">Start: ${p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</p>
            <p class="text-xs text-muted">Target: ${p.target_end_date ? new Date(p.target_end_date).toLocaleDateString() : '—'}</p>
          </div>
        </div>
        <div class="card-body">
          ${goals.length > 0 ? `
            <div style="display:flex;gap:6px;align-items:center;margin-bottom:12px">
              <div style="flex:1;height:6px;background:var(--bg-alt);border-radius:3px;overflow:hidden">
                <div style="width:${goals.length > 0 ? (completedGoals / goals.length * 100) : 0}%;height:100%;background:var(--success);border-radius:3px;transition:width 0.3s"></div>
              </div>
              <span class="text-xs text-muted">${Math.round(goals.length > 0 ? (completedGoals / goals.length * 100) : 0)}%</span>
            </div>
            ${goals.slice(0, 3).map(g => `
              <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem">
                <span style="color:${g.status === 'completed' ? 'var(--success)' : g.status === 'in_progress' ? 'var(--primary)' : 'var(--text-light)'}">
                  ${g.status === 'completed' ? '✓' : g.status === 'in_progress' ? '◉' : '○'}
                </span>
                ${g.goal}
              </div>
            `).join('')}
            ${goals.length > 3 ? `<p class="text-xs text-muted mt-sm">+${goals.length - 3} more goals</p>` : ''}
          ` : '<p class="text-sm text-muted">No goals defined</p>'}
        </div>
      </div>
    `;
  }

  function filterPlans(status, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#plans-list > .card').forEach(card => {
      if (status === 'all' || card.dataset.status === status) card.style.display = '';
      else card.style.display = 'none';
    });
  }

  async function viewPlan(id) {
    const res = await API.get(`/treatment-plans/${id}`);
    if (!res.success) { Toast.error('Plan not found.'); return; }
    const p = res.data;
    const goals = typeof p.goals === 'string' ? JSON.parse(p.goals) : (p.goals || []);
    const progress = typeof p.progress_notes === 'string' ? JSON.parse(p.progress_notes) : (p.progress_notes || []);

    Modal.open({
      title: `Treatment Plan — ${p.client_first_name || ''} ${p.client_last_name || ''}`,
      large: true,
      body: `
        <div style="display:flex;gap:8px;margin-bottom:20px">
          <span class="badge badge-${p.status === 'active' ? 'success' : 'muted'}">${capitalize(p.status)}</span>
          <span class="badge badge-primary">${capitalize(p.case_type)}</span>
        </div>
        ${p.diagnosis ? `<div class="mb"><p class="text-sm text-muted">Diagnosis</p><p>${p.diagnosis}</p></div>` : ''}
        <h4 style="margin-bottom:12px">Goals</h4>
        ${goals.map((g, i) => `
          <div class="goal-item ${g.status || 'not_started'}">
            <div class="goal-header">
              <h4>${g.goal}</h4>
              <span class="badge badge-${g.status === 'completed' ? 'success' : g.status === 'in_progress' ? 'info' : 'muted'}">${capitalize(g.status || 'not_started')}</span>
            </div>
            ${(g.objectives || []).map(o => `<div class="objective-item"><span>•</span> ${o}</div>`).join('')}
          </div>
        `).join('')}
        <h4 style="margin:20px 0 12px">Progress Notes</h4>
        ${progress.length > 0 ? `
          <div class="progress-timeline">
            ${progress.map(pe => `
              <div class="progress-entry">
                <p class="progress-date">${formatDateTime(pe.date)}</p>
                <p class="progress-text">${pe.note}</p>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-sm text-muted">No progress notes yet</p>'}
        <div class="mt" style="border-top:1px solid var(--border-light);padding-top:16px">
          <h4 style="margin-bottom:8px">Add Progress Note</h4>
          <div class="form-group"><textarea class="form-control" id="progress-note-input" placeholder="Enter progress note..." rows="2"></textarea></div>
          <button class="btn btn-primary btn-sm" onclick="PlansPage.addProgress('${p.id}')">Add Note</button>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Close</button>
        ${p.status === 'active' ? `<button class="btn btn-danger btn-sm" onclick="PlansPage.closePlan('${p.id}')">Close Plan</button>` : ''}
      `,
    });
  }

  async function addProgress(planId) {
    const input = document.getElementById('progress-note-input');
    const note = input?.value?.trim();
    if (!note) { Toast.error('Please enter a progress note.'); return; }
    const res = await API.patch(`/treatment-plans/${planId}/progress`, { note });
    if (res.success) { Toast.success('Progress added!'); Modal.close(); render(); }
    else { Toast.error(res.error || 'Failed to add progress.'); }
  }

  async function closePlan(planId) {
    if (!confirm('Close this treatment plan?')) return;
    const res = await API.patch(`/treatment-plans/${planId}/close`);
    if (res.success) { Toast.success('Plan closed.'); Modal.close(); render(); }
    else { Toast.error(res.error || 'Failed to close.'); }
  }

  async function showNewPlanModal() {
    // Show loading state first
    Modal.open({
      title: 'New Treatment Plan',
      body: `<div class="loading-spinner"><div class="spinner"></div></div>`,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>'
    });

    const res = await API.get('/clients');
    const clients = res.data || [];

    Modal.open({
      title: 'New Treatment Plan',
      large: true,
      body: `
        <form id="new-plan-form">
          <div class="form-row">
            <div class="form-group">
                <label>Client *</label>
                <select class="form-control" name="client_id" required>
                    <option value="">Select a client...</option>
                    ${clients.map(c => `<option value="${c.id}">${c.first_name} ${c.last_name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Case Type</label>
              <select class="form-control" name="case_type"><option value="individual">Individual</option><option value="couple">Couple</option><option value="family">Family</option><option value="divorce">Divorce</option><option value="child">Child</option></select>
            </div>
          </div>
          <div class="form-group"><label>Diagnosis</label><textarea class="form-control" name="diagnosis" rows="2"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Start Date</label><input class="form-control" type="date" name="start_date" value="${new Date().toISOString().split('T')[0]}"></div>
            <div class="form-group"><label>Target End Date</label><input class="form-control" type="date" name="target_end_date"></div>
          </div>
          <h4 style="margin:16px 0 8px">Goals</h4>
          <div id="goals-container">
            <div class="form-group"><input class="form-control" name="goal_1" placeholder="Goal 1"></div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="PlansPage.addGoalField()">+ Add Goal</button>
        </form>
      `,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="PlansPage.submitPlan()">Create Plan</button>',
    });
  }

  let goalCount = 1;
  function addGoalField() {
    goalCount++;
    const container = document.getElementById('goals-container');
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `<input class="form-control" name="goal_${goalCount}" placeholder="Goal ${goalCount}">`;
    container.appendChild(div);
  }

  async function submitPlan() {
    const form = document.getElementById('new-plan-form');
    const fd = Object.fromEntries(new FormData(form));
    if (!fd.client_id) { Toast.error('Please select a client.'); return; }
    const goals = Object.entries(fd).filter(([k]) => k.startsWith('goal_')).map(([, v]) => v).filter(Boolean).map(g => ({ goal: g, objectives: [], status: 'not_started' }));
    const data = { client_id: fd.client_id, diagnosis: fd.diagnosis, case_type: fd.case_type, start_date: fd.start_date || null, target_end_date: fd.target_end_date || null, goals };
    const res = await API.post('/treatment-plans', data);
    if (res.success) { Toast.success('Plan created!'); Modal.close(); goalCount = 1; render(); }
    else { Toast.error(res.error || 'Failed to create plan.'); }
  }

  return { render, showNewPlanModal, addGoalField, submitPlan, viewPlan, addProgress, closePlan, filterPlans };
})();
