/**
 * Billing Page — Invoices, payments, revenue
 */
const BillingPage = (() => {
  function formatCurrency(amount, currency) {
    const symbolMap = { 'NGN': '₦', 'USD': '$', 'EUR': '€', 'GBP': '£' };
    const sym = symbolMap[currency || 'NGN'] || '$';
    return `${sym}${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatCurrencyTotals(totalsObj) {
    if (!totalsObj || Object.keys(totalsObj).length === 0) return formatCurrency(0, 'NGN');
    return Object.entries(totalsObj).map(([curr, amt]) => formatCurrency(amt, curr)).join(' | ');
  }

  async function render() {
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    const [invoiceRes, revenueRes] = await Promise.all([
      API.get('/billing/invoices'),
      API.get('/billing/revenue', { month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
    ]);

    const invoices = invoiceRes.data || [];
    const revenue = revenueRes.data || {};

    const paid = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending' || i.status === 'sent');
    
    const totalPaidByCurrency = paid.reduce((acc, i) => {
        const curr = i.currency || 'NGN';
        acc[curr] = (acc[curr] || 0) + parseFloat(i.amount || 0);
        return acc;
    }, {});
    
    const totalPendingByCurrency = pending.reduce((acc, i) => {
        const curr = i.currency || 'NGN';
        acc[curr] = (acc[curr] || 0) + parseFloat(i.amount || 0);
        return acc;
    }, {});

    content.innerHTML = `
      <div class="fade-in-up">
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
            <div class="stat-value" style="font-size: 1.2rem;">${formatCurrencyTotals(totalPaidByCurrency)}</div>
            <div class="stat-label">Revenue Collected</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
            <div class="stat-value" style="font-size: 1.2rem;">${formatCurrencyTotals(totalPendingByCurrency)}</div>
            <div class="stat-label">Pending Payments</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg></div>
            <div class="stat-value">${invoices.length}</div>
            <div class="stat-label">Total Invoices</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
            <div class="stat-value" style="font-size: 1.2rem;">${formatCurrencyTotals(revenue.total_revenue_by_currency)}</div>
            <div class="stat-label">This Month Revenue</div>
          </div>
        </div>

        <div class="card mt-lg">
          <div class="card-header">
            <h3>Invoices</h3>
            <button class="btn btn-primary btn-sm" onclick="BillingPage.showNewInvoiceModal()">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Create Invoice
            </button>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.length === 0
        ? '<tr><td colspan="6" class="text-center text-muted" style="padding:40px">No invoices yet</td></tr>'
        : invoices.map(inv => `
                    <tr>
                      <td class="font-medium">${inv.client_first_name || ''} ${inv.client_last_name || ''}</td>
                      <td class="font-semibold">${formatCurrency(inv.amount, inv.currency)}</td>
                      <td>
                        <span class="badge badge-${inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}">
                          ${capitalize(inv.status)}
                        </span>
                      </td>
                      <td class="text-sm text-muted">${inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—'}</td>
                      <td class="text-sm text-muted">${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                      <td>
                        ${inv.status !== 'paid' ? `<button class="btn btn-success btn-sm" onclick="BillingPage.markPaid('${inv.id}')">Mark Paid</button>` : '<span class="text-sm text-muted">Paid ✓</span>'}
                      </td>
                    </tr>
                  `).join('')
      }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    if (window.location.hash.includes('new=1')) showNewInvoiceModal();
  }

  async function showNewInvoiceModal() {
    Modal.open({
      title: 'Create Invoice',
      body: `<div class="loading-spinner"><div class="spinner"></div></div>`,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>'
    });

    const res = await API.get('/clients');
    const clients = res.data || [];

    Modal.open({
      title: 'Create Invoice',
      body: `
        <form id="new-invoice-form">
          <div class="form-row">
            <div class="form-group">
                <label>Client *</label>
                <select class="form-control" name="client_id" required>
                    <option value="">Select a client...</option>
                    ${clients.map(c => `<option value="${c.id}">${c.first_name} ${c.last_name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group" style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <label>Currency *</label>
                    <select class="form-control" name="currency" required>
                        <option value="NGN" selected>NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </div>
                <div style="flex: 2;">
                    <label>Amount *</label>
                    <input class="form-control" type="number" name="amount" step="0.01" required>
                </div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Issue Date</label><input class="form-control" type="date" name="issue_date" value="${new Date().toISOString().split('T')[0]}"></div>
            <div class="form-group"><label>Due Date</label><input class="form-control" type="date" name="due_date"></div>
          </div>
          <div class="form-group"><label>Description</label><textarea class="form-control" name="description" rows="2" placeholder="Session description..."></textarea></div>
          <div class="form-group"><label>Session Type</label>
            <select class="form-control" name="session_type"><option value="individual">Individual</option><option value="couple">Couple</option><option value="family">Family</option></select>
          </div>
        </form>
      `,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="BillingPage.submitInvoice()">Create</button>',
    });
  }

  async function submitInvoice() {
    const form = document.getElementById('new-invoice-form');
    const data = Object.fromEntries(new FormData(form));
    if (!data.client_id || !data.amount) { Toast.error('Please select a client and enter an amount.'); return; }
    data.amount = parseFloat(data.amount);
    const res = await API.post('/billing/invoices', data);
    if (res.success) { Toast.success('Invoice created!'); Modal.close(); render(); }
    else { Toast.error(res.error || 'Failed to create invoice.'); }
  }

  async function markPaid(id) {
    const res = await API.patch(`/billing/invoices/${id}/pay`);
    if (res.success) { Toast.success('Invoice marked as paid!'); render(); }
    else { Toast.error(res.error || 'Failed to update.'); }
  }

  return { render, showNewInvoiceModal, submitInvoice, markPaid };
})();
