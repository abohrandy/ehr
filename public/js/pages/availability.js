/**
 * Availability Settings Page — Therapist can set their recurring schedule and breaks.
 */
window.AvailabilityPage = (() => {
    let settings = { availability: [], breaks: [] };

    async function init() {
        const topbarActions = document.getElementById('topbar-actions');
        topbarActions.innerHTML = `
            <button class="btn btn-primary" id="save-availability-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Schedule
            </button>
        `;

        const html = `
            <div class="fade-in-up" style="max-width: 900px; margin: 0 auto;">
                <div class="card mb-4">
                    <div class="card-header">
                        <h3 class="card-title">Weekly Working Hours</h3>
                        <p class="text-sm text-muted">Configure the days and times you are available for sessions.</p>
                    </div>
                    <div class="card-body">
                        <div id="availability-list" class="availability-list">
                            <!-- Days auto-populated -->
                        </div>
                    </div>
                </div>

                <div class="card mb-4">
                    <div class="card-header">
                        <div style="display:flex; justify-content:between; align-items:center;">
                            <div>
                                <h3 class="card-title">Recurring Breaks</h3>
                                <p class="text-sm text-muted">Set lunch or administrative breaks that block booking slots.</p>
                            </div>
                            <button class="btn btn-sm btn-outline" id="add-break-btn">+ Add Break</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="breaks-list">
                            <!-- Breaks list -->
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Booking Rules</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Minimum Advance Booking (Hours)</label>
                                <input type="number" id="min-advance" class="form-control" value="4" min="0">
                                <small class="text-muted">Prevents last-minute bookings.</small>
                            </div>
                            <div class="form-group">
                                <label>Max Sessions per Day</label>
                                <input type="number" id="max-sessions" class="form-control" placeholder="No limit">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;

        // Bind events
        document.getElementById('add-break-btn').addEventListener('click', () => addBreakRow());
        document.getElementById('save-availability-btn').addEventListener('click', saveSettings);

        await fetchData();
    }

    async function fetchData() {
        const res = await API.get('/availability');
        if (res.success) {
            settings = res.data;
            renderAvailability();
            renderBreaks();

            // Set global rules
            if (settings.availability.length > 0) {
                document.getElementById('min-advance').value = settings.availability[0].min_advance_hours;
                document.getElementById('max-sessions').value = settings.availability[0].max_sessions_per_day || '';
            }
        }
    }

    function renderAvailability() {
        const container = document.getElementById('availability-list');
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        container.innerHTML = days.map((day, index) => {
            const rule = settings.availability.find(a => a.day_of_week === index);
            const active = !!rule;
            return `
                <div class="availability-row ${active ? 'active' : ''}" data-day="${index}">
                    <div class="day-check">
                        <input type="checkbox" id="check-day-${index}" ${active ? 'checked' : ''} onchange="AvailabilityPage.toggleDay(${index})">
                        <label for="check-day-${index}">${day}</label>
                    </div>
                    <div class="time-inputs ${!active ? 'hidden' : ''}">
                        <input type="time" class="form-control start-time" value="${rule?.start_time || '09:00'}">
                        <span>to</span>
                        <input type="time" class="form-control end-time" value="${rule?.end_time || '17:00'}">
                    </div>
                    <div class="status-label">${active ? 'Working' : 'Off'}</div>
                </div>
            `;
        }).join('');
    }

    function toggleDay(index) {
        const row = document.querySelector(`.availability-row[data-day="${index}"]`);
        const inputs = row.querySelector('.time-inputs');
        const label = row.querySelector('.status-label');
        const checked = row.querySelector('input[type="checkbox"]').checked;

        row.classList.toggle('active', checked);
        inputs.classList.toggle('hidden', !checked);
        label.textContent = checked ? 'Working' : 'Off';
    }

    function renderBreaks() {
        const container = document.getElementById('breaks-list');
        if (settings.breaks.length === 0) {
            container.innerHTML = `<p class="text-center text-muted py-3">No recurring breaks configured.</p>`;
            return;
        }
        container.innerHTML = '';
        settings.breaks.forEach(b => addBreakRow(b));
    }

    function addBreakRow(data = null) {
        const container = document.getElementById('breaks-list');
        const placeholder = container.querySelector('.text-center');
        if (placeholder) placeholder.remove();

        const div = document.createElement('div');
        div.className = 'break-row mb-3';
        div.innerHTML = `
            <div class="form-row" style="align-items: flex-end;">
                <div class="form-group" style="flex: 2;">
                    <label>Break Type</label>
                    <select class="form-control b-type">
                        <option value="lunch" ${data?.break_type === 'lunch' ? 'selected' : ''}>Lunch Break</option>
                        <option value="admin" ${data?.break_type === 'admin' ? 'selected' : ''}>Admin Time</option>
                        <option value="other" ${data?.break_type === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Start</label>
                    <input type="time" class="form-control b-start" value="${data?.start_time || '13:00'}">
                </div>
                <div class="form-group">
                    <label>End</label>
                    <input type="time" class="form-control b-end" value="${data?.end_time || '14:00'}">
                </div>
                <button class="btn btn-icon" style="color:var(--danger); margin-bottom: 20px;" onclick="this.parentElement.parentElement.remove()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
            </div>
        `;
        container.appendChild(div);
    }

    async function saveSettings() {
        const btn = document.getElementById('save-availability-btn');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const availability = [];
        document.querySelectorAll('.availability-row.active').forEach(row => {
            availability.push({
                day_of_week: parseInt(row.dataset.day),
                start_time: row.querySelector('.start-time').value,
                end_time: row.querySelector('.end-time').value,
                min_advance_hours: parseInt(document.getElementById('min-advance').value) || 4,
                max_sessions_per_day: parseInt(document.getElementById('max-sessions').value) || null
            });
        });

        const breaks = [];
        document.querySelectorAll('.break-row').forEach(row => {
            breaks.push({
                break_type: row.querySelector('.b-type').value,
                start_time: row.querySelector('.b-start').value,
                end_time: row.querySelector('.b-end').value
            });
        });

        const res = await API.put('/availability', { availability, breaks });
        if (res.success) {
            Toast.show('Schedule updated successfully.', 'success');
            await fetchData();
        } else {
            Toast.show(res.error || 'Failed to update schedule.', 'error');
        }
        btn.disabled = false;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Schedule`;
    }

    return { render: init, toggleDay };
})();
