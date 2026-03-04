/**
 * Users Management Page (Admin Only)
 */
window.UsersPage = (() => {
    let users = [];

    async function init() {
        // Build Topbar Actions
        const topbarActions = document.getElementById('topbar-actions');
        topbarActions.innerHTML = `
            <button class="btn btn-primary" id="new-user-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New User
            </button>
        `;

        // Build Content Area
        const html = `
            <div class="card">
                <div class="card-body" style="padding: 0;">
                    <div class="table-wrap">
                        <table class="data-table" id="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="5" class="text-center text-muted py-4">Loading users...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;

        // Bind events
        document.getElementById('new-user-btn').addEventListener('click', openNewUserModal);

        await fetchData();
    }

    async function fetchData() {
        const res = await API.get('/users');
        if (res.success) {
            users = res.data;
            renderTable();
        } else {
            Toast.show('Failed to load users: ' + res.error, 'error');
        }
    }

    function renderTable() {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:40px;">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td class="font-medium">${u.first_name} ${u.last_name}</td>
                <td class="text-muted"><a href="mailto:${u.email}">${u.email}</a></td>
                <td>
                    <span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-info'}">${u.role}</span>
                </td>
                <td>
                    <span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Deactivated'}</span>
                </td>
                <td style="text-align: right;">
                    <button class="btn-icon" title="Edit User" onclick="UsersPage.editUser('${u.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    ${u.is_active ? `
                    <button class="btn-icon" style="color:var(--danger);" title="Deactivate" onclick="UsersPage.deactivateUser('${u.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    </button>` : ''}
                </td>
            </tr>
        `).join('');
    }

    async function editUser(id) {
        const user = users.find(u => u.id === id);
        if (!user) {
            Toast.show('User data not found localy. Refreshing...', 'info');
            await fetchData();
            return;
        }

        Modal.show('Edit User', `
            <form id="edit-user-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" id="eu-fname" class="form-control" value="${user.first_name}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" id="eu-lname" class="form-control" value="${user.last_name}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="eu-role" class="form-control">
                        <option value="therapist" ${user.role === 'therapist' ? 'selected' : ''}>Therapist</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="eu-active" class="form-control">
                        <option value="true" ${user.is_active ? 'selected' : ''}>Active</option>
                        <option value="false" ${!user.is_active ? 'selected' : ''}>Deactivated</option>
                    </select>
                </div>
            </form>
        `, [
            `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>`,
            `<button class="btn btn-primary" id="eu-submit-btn">Save Changes</button>`
        ]);

        document.getElementById('eu-submit-btn').addEventListener('click', async (e) => {
            const btn = e.target;
            if (!document.getElementById('edit-user-form').reportValidity()) return;

            btn.disabled = true;
            btn.textContent = 'Saving...';

            const payload = {
                first_name: document.getElementById('eu-fname').value,
                last_name: document.getElementById('eu-lname').value,
                role: document.getElementById('eu-role').value,
                is_active: document.getElementById('eu-active').value === 'true',
            };

            const res = await API.put('/users/' + id, payload);
            if (res.success) {
                Toast.show('User updated successfully.', 'success');
                Modal.close();
                fetchData();
            } else {
                Toast.show(res.error || 'Failed to update user.', 'error');
            }
            btn.disabled = false;
            btn.textContent = 'Save Changes';
        });
    }

    async function deactivateUser(id) {
        if (!confirm('Are you sure you want to deactivate this user? They will no longer be able to log in.')) return;

        const res = await API.delete('/users/' + id);
        if (res.success) {
            Toast.show('User deactivated.', 'success');
            fetchData();
        } else {
            Toast.show('Failed to deactivate: ' + res.error, 'error');
        }
    }

    function openNewUserModal() {
        Modal.show('Create New User', `
            <form id="create-user-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" id="cu-fname" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" id="cu-lname" class="form-control" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="cu-email" class="form-control" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Role</label>
                        <select id="cu-role" class="form-control" required>
                            <option value="therapist">Therapist</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Phone (Optional)</label>
                        <input type="text" id="cu-phone" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label>Temporary Password</label>
                    <input type="password" id="cu-pass" class="form-control" required placeholder="Min 8 characters">
                </div>
            </form>
        `, [
            `<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>`,
            `<button class="btn btn-primary" id="cu-submit-btn">Create User</button>`
        ]);

        document.getElementById('cu-submit-btn').addEventListener('click', async (e) => {
            const btn = e.target;
            const form = document.getElementById('create-user-form');
            if (!form.reportValidity()) return;

            btn.disabled = true;
            btn.textContent = 'Creating...';

            const payload = {
                first_name: document.getElementById('cu-fname').value,
                last_name: document.getElementById('cu-lname').value,
                email: document.getElementById('cu-email').value,
                role: document.getElementById('cu-role').value,
                phone: document.getElementById('cu-phone').value,
                password: document.getElementById('cu-pass').value,
            };

            const res = await API.post('/users', payload);
            if (res.success) {
                Toast.show('User created successfully.', 'success');
                Modal.close();
                fetchData();
            } else {
                Toast.show(res.error || 'Failed to create user.', 'error');
            }
            btn.disabled = false;
            btn.textContent = 'Create User';
        });
    }

    return { render: init, editUser, deactivateUser };
})();
