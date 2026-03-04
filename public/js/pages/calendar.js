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

  async function showBookModal() {
    // Show loading state in modal first
    Modal.open({
      title: 'Book Appointment',
      body: `<div class="loading-spinner"><div class="spinner"></div></div>`,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>'
    });

    const [clientsRes, usersRes] = await Promise.all([
      API.get('/clients'),
      API.get('/users')
    ]);

    const clients = clientsRes.data || [];
    const staff = (usersRes.data || []).filter(u => u.role === 'therapist' || u.role === 'admin');
    const currentUser = Auth.getUser();

    Modal.open({
      title: 'Book Appointment',
      body: `
        <form id="book-form">
          <div class="form-group">
            <label>Client *</label>
            <select class="form-control" name="client_id" required>
              <option value="">Select a client...</option>
              ${clients.map(c => `<option value="${c.id}">${c.first_name} ${c.last_name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Therapist *</label>
            <select class="form-control" name="therapist_id" id="book-therapist" required>
              <option value="">Select a therapist...</option>
              ${staff.map(u => `<option value="${u.id}" ${u.id === currentUser?.id ? 'selected' : ''}>${u.first_name} ${u.last_name}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Date *</label><input class="form-control" type="date" name="date" id="book-date" required value="${currentDate.toISOString().split('T')[0]}"></div>
            <div class="form-group">
                <label>Time Slot *</label>
                <select class="form-control" name="start_time" id="book-slots" required disabled>
                    <option value="">Select therapist and date...</option>
                </select>
            </div>
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
        <div id="booking-info" style="background:var(--info-bg);padding:12px;border-radius:8px;margin-top:8px">
          <p class="text-sm" style="color:var(--info)"><strong>ℹ️ Select a date and therapist</strong> to see available 45-minute slots.</p>
        </div>
      `,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" id="book-submit-btn" disabled>Book Session</button>',
    });

    // Slot update logic
    const updateSlots = async () => {
      const therapistId = document.getElementById('book-therapist').value;
      const date = document.getElementById('book-date').value;
      const slotSelect = document.getElementById('book-slots');
      const submitBtn = document.getElementById('book-submit-btn');
      const infoBox = document.getElementById('booking-info');

      if (!therapistId || !date) {
        slotSelect.innerHTML = '<option value="">Select therapist and date...</option>';
        slotSelect.disabled = true;
        submitBtn.disabled = true;
        infoBox.innerHTML = `<p class="text-sm" style="color:var(--info)"><strong>ℹ️ Select a date and therapist</strong> to see available 45-minute slots.</p>`;
        return;
      }

      slotSelect.disabled = true;
      slotSelect.innerHTML = '<option>Loading slots...</option>';
      submitBtn.disabled = true;
      infoBox.innerHTML = `<div class="loading-spinner small"><div class="spinner"></div></div>`;


      const res = await API.get('/availability/slots', { therapist_id: therapistId, date });
      if (res.success && res.data.length > 0) {
        slotSelect.innerHTML = res.data.map(s => `<option value="${s.start_time}">${s.display_time}</option>`).join('');
        slotSelect.disabled = false;
        submitBtn.disabled = false;
        infoBox.innerHTML = `<p class="text-sm" style="color:var(--success)"><strong>✅ ${res.data.length} slots available.</strong> Each session is 45m + 15m buffer.</p>`;
      } else {
        slotSelect.innerHTML = '<option value="">No slots available</option>';
        infoBox.innerHTML = `<p class="text-sm" style="color:var(--danger)"><strong>⚠️ ${res.message || 'No available slots for this day.'}</strong></p>`;
      }
    };

    document.getElementById('book-therapist').addEventListener('change', updateSlots);
    document.getElementById('book-date').addEventListener('change', updateSlots);
    document.getElementById('book-submit-btn').addEventListener('click', () => CalendarPage.submitBooking());

    // Trigger initial load
    updateSlots();
  }

  async function submitBooking() {
    const form = document.getElementById('book-form');
    const fd = Object.fromEntries(new FormData(form));
    const btn = document.getElementById('book-submit-btn');

    if (!fd.client_id || !fd.therapist_id || !fd.start_time) {
      Toast.error('Please select a valid client, therapist, and time slot.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Booking...';

    const res = await API.post('/appointments', fd);
    if (res.success) {
      Toast.success('Appointment booked successfully!');
      Modal.close();
      render();
    } else {
      Toast.error(res.error || 'Booking failed.');
    }
    btn.disabled = false;
    btn.textContent = 'Book Session';
  }

  return { render, prevMonth, nextMonth, prevDay, nextDay, goToday, setView, viewDay, showBookModal, submitBooking };
})();
