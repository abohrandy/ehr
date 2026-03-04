/**
 * Therapist Dashboard Page
 */
const DashboardPage = (() => {
    async function render() {
        const content = document.getElementById('content-area');
        content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

        // Fetch data in parallel
        const [apptRes, clientRes, billingRes, planRes] = await Promise.all([
            API.get('/appointments', { status: 'scheduled' }),
            API.get('/clients'),
            API.get('/billing/invoices'),
            API.get('/treatment-plans'),
        ]);

        const appointments = apptRes.data || [];
        const clients = clientRes.data || [];
        const invoices = billingRes.data || [];
        const plans = planRes.data || [];

        const today = new Date().toISOString().split('T')[0];
        const todayAppts = appointments.filter(a => a.start_time && a.start_time.startsWith(today));
        const upcomingAppts = appointments.filter(a => a.start_time && a.start_time > new Date().toISOString()).slice(0, 5);

        const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
        const activePlans = plans.filter(p => p.status === 'active').length;

        content.innerHTML = `
      <div class="fade-in-up">
        <!-- Stats -->
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-icon teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <div class="stat-value">${todayAppts.length}</div>
            <div class="stat-label">Today's Sessions</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/></svg>
            </div>
            <div class="stat-value">${clients.length}</div>
            <div class="stat-label">Active Clients</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
            </div>
            <div class="stat-value">$${totalRevenue.toLocaleString()}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            <div class="stat-value">${activePlans}</div>
            <div class="stat-label">Active Plans</div>
          </div>
        </div>

        <!-- Grid -->
        <div class="dashboard-grid">
          <!-- Today's Appointments -->
          <div class="card">
            <div class="card-header">
              <h3>Today's Appointments</h3>
              <a href="#/calendar" class="btn btn-ghost btn-sm">View Calendar</a>
            </div>
            <div class="card-body">
              ${todayAppts.length === 0
                ? '<div class="empty-state" style="padding:30px"><p>No sessions scheduled for today</p></div>'
                : todayAppts.map(a => `
                  <div class="appt-item">
                    <div class="appt-time">${formatTime(a.start_time)}</div>
                    <div class="appt-info">
                      <div class="appt-name">${a.client_first_name || ''} ${a.client_last_name || ''}</div>
                      <div class="appt-type">${capitalize(a.session_type)} · ${capitalize(a.location)}</div>
                    </div>
                    <span class="badge badge-${a.status === 'scheduled' ? 'info' : a.status === 'completed' ? 'success' : 'muted'}">${capitalize(a.status)}</span>
                  </div>
                `).join('')
            }
            </div>
          </div>

          <!-- Upcoming Sessions -->
          <div class="card">
            <div class="card-header">
              <h3>Upcoming Sessions</h3>
              <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/calendar'">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                Book
              </button>
            </div>
            <div class="card-body">
              ${upcomingAppts.length === 0
                ? '<div class="empty-state" style="padding:30px"><p>No upcoming sessions</p></div>'
                : upcomingAppts.map(a => `
                  <div class="appt-item">
                    <div class="appt-time">${formatDate(a.start_time)}<br><small>${formatTime(a.start_time)}</small></div>
                    <div class="appt-info">
                      <div class="appt-name">${a.client_first_name || ''} ${a.client_last_name || ''}</div>
                      <div class="appt-type">${capitalize(a.session_type)}</div>
                    </div>
                  </div>
                `).join('')
            }
            </div>
          </div>

          <!-- Recent Clients -->
          <div class="card">
            <div class="card-header">
              <h3>Recent Clients</h3>
              <a href="#/clients" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div class="card-body">
              ${clients.slice(0, 5).map(c => `
                <div class="appt-item" style="cursor:pointer" onclick="window.location.hash='#/clients/${c.id}'">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--primary-bg);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.8rem">${(c.first_name?.[0] || '') + (c.last_name?.[0] || '')}</div>
                  <div class="appt-info">
                    <div class="appt-name">${c.first_name || ''} ${c.last_name || ''}</div>
                    <div class="appt-type">${capitalize(c.case_type || 'individual')}</div>
                  </div>
                  <span class="badge badge-${c.status === 'active' ? 'success' : 'muted'}">${capitalize(c.status || 'active')}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card">
            <div class="card-header"><h3>Quick Actions</h3></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
              <button class="btn btn-primary btn-full" onclick="window.location.hash='#/notes?new=1'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M12 18v-6M9 15h6"/></svg>
                Add Session Note
              </button>
              <button class="btn btn-outline btn-full" onclick="window.location.hash='#/clients?new=1'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/></svg>
                New Client
              </button>
              <button class="btn btn-outline btn-full" onclick="window.location.hash='#/plans?new=1'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                New Treatment Plan
              </button>
              <button class="btn btn-outline btn-full" onclick="window.location.hash='#/billing?new=1'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    return { render };
})();

// Helpers
function formatTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatDateTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}
