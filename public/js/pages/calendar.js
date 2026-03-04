/**
 * Calendar Page — Month view with appointment slots
 */
const CalendarPage = (() => {
    let currentDate = new Date();
    let viewMode = 'month'; // month, week, day

    async function render() {
        const content = document.getElementById('content-area');
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Fetch appointments for this month
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        const res = await API.get('/appointments/calendar', { start_date: startDate, end_date: endDate });
        const appointments = res.data || [];

        if (viewMode === 'month') {
            renderMonthView(content, year, month, monthName, appointments);
        } else {
            renderDayView(content, appointments);
        }
    }

    function renderMonthView(content, year, month, monthName, appointments) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Build calendar grid
        let cells = '';
        const prevMonthDays = new Date(year, month, 0).getDate();

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            cells += `<div class="calendar-day other-month"><div class="day-number">${prevMonthDays - i}</div></div>`;
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dayAppts = appointments.filter(a => a.start_time && a.start_time.startsWith(dateStr));

            cells += `
        <div class="calendar-day ${isToday ? 'today' : ''}" onclick="CalendarPage.viewDay('${dateStr}')">
          <div class="day-number">${day}</div>
          ${dayAppts.slice(0, 3).map(a => `
            <div class="cal-event" title="${a.client_first_name || ''} ${a.client_last_name || ''}">${formatTime(a.start_time)} ${a.client_first_name || ''}</div>
          `).join('')}
          ${dayAppts.length > 3 ? `<div class="text-xs text-muted">+${dayAppts.length - 3} more</div>` : ''}
        </div>
      `;
        }

        // Fill remaining cells
        const totalCells = firstDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            cells += `<div class="calendar-day other-month"><div class="day-number">${i}</div></div>`;
        }

        content.innerHTML = `
      <div class="fade-in-up">
        <div class="calendar-header">
          <div class="calendar-nav">
            <button class="btn btn-icon" onclick="CalendarPage.prevMonth()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h3>${monthName}</h3>
            <button class="btn btn-icon" onclick="CalendarPage.nextMonth()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="CalendarPage.goToday()">Today</button>
          </div>
          <div style="display:flex;gap:8px">
            <div class="btn-group">
              <button class="btn btn-sm ${viewMode === 'day' ? 'active' : 'btn-outline'}" onclick="CalendarPage.setView('day')">Day</button>
              <button class="btn btn-sm ${viewMode === 'month' ? 'active' : 'btn-outline'}" onclick="CalendarPage.setView('month')">Month</button>
            </div>
            <button class="btn btn-primary btn-sm" onclick="CalendarPage.showBookModal()">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Book
            </button>
          </div>
        </div>
        <div class="calendar-grid">
          <div class="calendar-day-header">Sun</div>
          <div class="calendar-day-header">Mon</div>
          <div class="calendar-day-header">Tue</div>
          <div class="calendar-day-header">Wed</div>
          <div class="calendar-day-header">Thu</div>
          <div class="calendar-day-header">Fri</div>
          <div class="calendar-day-header">Sat</div>
          ${cells}
        </div>
      </div>
    `;
    }

    function renderDayView(content, appointments) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayAppts = appointments.filter(a => a.start_time && a.start_time.startsWith(dateStr));
        const displayDate = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        let slots = '';
        for (let h = 9; h < 17; h++) {
            const timeLabel = `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
            const hourStr = String(h).padStart(2, '0');
            const appt = dayAppts.find(a => {
                const aHour = new Date(a.start_time).getHours();
                return aHour === h;
            });

            const isBuffer = dayAppts.some(a => {
                const aStart = new Date(a.start_time);
                const bufferStart = new Date(aStart.getTime() + 45 * 60000);
                const bufferEnd = new Date(aStart.getTime() + 60 * 60000);
                const slotTime = new Date(`${dateStr}T${hourStr}:00:00`);
                return slotTime >= bufferStart && slotTime < bufferEnd;
            });

            slots += `
        <div class="time-slot ${appt ? 'occupied' : ''} ${isBuffer ? 'buffer' : ''}">
          <div class="time-label">${timeLabel}</div>
          <div class="time-content">
            ${appt ? `<div class="slot-event">${appt.client_first_name || ''} ${appt.client_last_name || ''}<div class="slot-meta">${capitalize(appt.session_type)} · 45 min</div></div>` : ''}
            ${isBuffer && !appt ? '<span class="text-xs text-muted">Buffer (15 min)</span>' : ''}
          </div>
        </div>
      `;
        }

        content.innerHTML = `
      <div class="fade-in-up">
        <div class="calendar-header">
          <div class="calendar-nav">
            <button class="btn btn-icon" onclick="CalendarPage.prevDay()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h3>${displayDate}</h3>
            <button class="btn btn-icon" onclick="CalendarPage.nextDay()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="CalendarPage.goToday()">Today</button>
          </div>
          <div style="display:flex;gap:8px">
            <div class="btn-group">
              <button class="btn btn-sm ${viewMode === 'day' ? 'active' : 'btn-outline'}" onclick="CalendarPage.setView('day')">Day</button>
              <button class="btn btn-sm ${viewMode === 'month' ? 'active' : 'btn-outline'}" onclick="CalendarPage.setView('month')">Month</button>
            </div>
            <button class="btn btn-primary btn-sm" onclick="CalendarPage.showBookModal()">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Book
            </button>
          </div>
        </div>
        <div class="day-view">${slots}</div>
      </div>
    `;
    }

    function prevMonth() { currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1); render(); }
    function nextMonth() { currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); render(); }
    function prevDay() { currentDate.setDate(currentDate.getDate() - 1); render(); }
    function nextDay() { currentDate.setDate(currentDate.getDate() + 1); render(); }
    function goToday() { currentDate = new Date(); render(); }
    function setView(mode) { viewMode = mode; render(); }
    function viewDay(dateStr) { currentDate = new Date(dateStr + 'T12:00:00'); viewMode = 'day'; render(); }

    function showBookModal() {
        Modal.open({
            title: 'Book Appointment',
            body: `
        <form id="book-form">
          <div class="form-group"><label>Client ID *</label><input class="form-control" name="client_id" required></div>
          <div class="form-group"><label>Therapist ID *</label><input class="form-control" name="therapist_id" required value="${Auth.getUser()?.id || ''}"></div>
          <div class="form-row">
            <div class="form-group"><label>Date *</label><input class="form-control" type="date" name="date" required value="${currentDate.toISOString().split('T')[0]}"></div>
            <div class="form-group"><label>Time *</label><input class="form-control" type="time" name="time" required value="09:00"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Session Type</label>
              <select class="form-control" name="session_type"><option value="individual">Individual</option><option value="couple">Couple</option><option value="family">Family</option><option value="child">Child</option></select>
            </div>
            <div class="form-group"><label>Location</label>
              <select class="form-control" name="location"><option value="in-person">In-Person</option><option value="telehealth">Telehealth</option></select>
            </div>
          </div>
          <div class="form-group"><label>Notes</label><textarea class="form-control" name="notes" rows="2"></textarea></div>
        </form>
        <div style="background:var(--info-bg);padding:12px;border-radius:8px;margin-top:8px">
          <p class="text-sm" style="color:var(--info)"><strong>ℹ️ Session = 45 min + 15 min buffer.</strong> The system blocks 60 minutes total and prevents overlapping bookings.</p>
        </div>
      `,
            footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="CalendarPage.submitBooking()">Book Session</button>',
        });
    }

    async function submitBooking() {
        const form = document.getElementById('book-form');
        const fd = Object.fromEntries(new FormData(form));
        if (!fd.client_id || !fd.therapist_id || !fd.date || !fd.time) {
            Toast.error('Please fill in all required fields.');
            return;
        }
        const startTime = new Date(`${fd.date}T${fd.time}:00`).toISOString();
        const res = await API.post('/appointments', {
            client_id: fd.client_id,
            therapist_id: fd.therapist_id,
            start_time: startTime,
            session_type: fd.session_type,
            location: fd.location,
            notes: fd.notes,
        });
        if (res.success) {
            Toast.success('Appointment booked!');
            Modal.close();
            render();
        } else {
            Toast.error(res.error || 'Booking failed.');
        }
    }

    return { render, prevMonth, nextMonth, prevDay, nextDay, goToday, setView, viewDay, showBookModal, submitBooking };
})();
