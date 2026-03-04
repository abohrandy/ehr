/**
 * Settings Page (Admin Only)
 */
window.SettingsPage = (() => {
    let settings = {};

    async function init() {
        const topbarActions = document.getElementById('topbar-actions');
        topbarActions.innerHTML = `
            <button class="btn btn-primary" id="save-settings-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Settings
            </button>
        `;

        const html = `
            <div class="fade-in">
                <div class="dashboard-grid">
                    <!-- Practice Details -->
                    <div class="card">
                        <div class="card-header">
                            <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;vertical-align:middle;margin-right:8px;"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Practice Details</h3>
                        </div>
                        <div class="card-body">
                            <form id="practice-settings-form">
                                <div class="form-group">
                                    <label>Practice Name</label>
                                    <input type="text" id="setting-practice_name" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Official Email</label>
                                    <input type="email" id="setting-practice_email" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" id="setting-practice_phone" class="form-control" required>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Clinical & Portal -->
                    <div class="card">
                        <div class="card-header">
                            <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;vertical-align:middle;margin-right:8px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> System Preferences</h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label>Session Buffer (Minutes)</label>
                                <input type="number" id="setting-session_buffer_minutes" class="form-control" min="0" max="60">
                                <p class="text-xs text-muted mt-sm">Time automatically added after each appointment.</p>
                            </div>
                            <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-light);">
                            <div class="form-group">
                                <label>Client Portal Status</label>
                                <select id="setting-portal_enabled" class="form-control">
                                    <option value="true">Enabled</option>
                                    <option value="false">Disabled</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Self-Service Booking</label>
                                <select id="setting-allow_client_booking" class="form-control">
                                    <option value="true">Allowed</option>
                                    <option value="false">Restricted (Therapist only)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;

        document.getElementById('save-settings-btn').addEventListener('click', saveSettings);

        await fetchData();
    }

    async function fetchData() {
        const res = await API.get('/settings');
        if (res.success) {
            settings = res.data;
            // Populate form
            Object.keys(settings).forEach(key => {
                const el = document.getElementById('setting-' + key);
                if (el) el.value = settings[key];
            });
        }
    }

    async function saveSettings() {
        const btn = document.getElementById('save-settings-btn');
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;margin-right:8px;"></span> Saving...`;

        const payload = {};
        const inputs = document.querySelectorAll('[id^="setting-"]');
        inputs.forEach(input => {
            const key = input.id.replace('setting-', '');
            payload[key] = input.value;
        });

        const res = await API.put('/settings', payload);
        if (res.success) {
            Toast.show('Settings updated successfully.', 'success');
            // If practice name changed, update UI immediately
            if (payload.practice_name) {
                document.querySelectorAll('.brand-text').forEach(el => el.textContent = payload.practice_name);
            }
        } else {
            Toast.show(res.error || 'Failed to save settings.', 'error');
        }

        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Settings`;
    }

    return { render: init };
})();
