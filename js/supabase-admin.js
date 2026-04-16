/**
 * IHYA NYC - Supabase Admin JS
 * Handles: login, events CRUD, flyer uploads, recurring events
 */

const PASSWORD_HASH = '460b33920fa4238f8bc78abbe86cc61c2c404567cc3a13887a6c3a9be81eab23';
const SUPABASE_URL  = 'https://dpinugfkomjxybdixsbz.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaW51Z2Zrb21qeHliZGl4c2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDAyNjksImV4cCI6MjA5MTkxNjI2OX0.-BUEodcxcDF1SiFn-QHJq70f6yl7KrX_RPgpo_Q7zgM';

let allEvents  = [];
let editingId  = null;
let flyerFile  = null;
let isLoggedIn = false;
let scheduleType = 'one-time';

// INIT
window.addEventListener('DOMContentLoaded', () => {
  buildTimeOptions('f-time');
  buildTimeOptions('f-recurring-time');
  checkSession();
  setupDragDrop();
});

// Build 15-minute increment time dropdown
function buildTimeOptions(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const ampm  = h >= 12 ? 'PM' : 'AM';
      const hour  = ((h % 12) || 12);
      const label = `${hour}:${String(m).padStart(2,'0')} ${ampm}`;
      const value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      const opt   = document.createElement('option');
      opt.value   = value;
      opt.textContent = label;
      sel.appendChild(opt);
    }
  }
}

// SCHEDULE TOGGLE
function setSchedule(type) {
  scheduleType = type;
  document.getElementById('btn-one-time').classList.toggle('active', type === 'one-time');
  document.getElementById('btn-recurring').classList.toggle('active', type === 'recurring');

  const dateFields      = document.getElementById('date-fields');
  const recurringFields = document.getElementById('recurring-fields');

  if (type === 'one-time') {
    dateFields.style.display      = 'contents';
    recurringFields.style.display = 'none';
  } else {
    dateFields.style.display      = 'none';
    recurringFields.style.display = 'contents';
  }
}

// AUTH
async function sha256(message) {
  const msgBuffer  = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function attemptLogin() {
  const input = document.getElementById('password-input').value;
  const error = document.getElementById('login-error');
  const hash  = await sha256(input);
  if (hash === PASSWORD_HASH) {
    error.style.display = 'none';
    sessionStorage.setItem('ihya_admin_session', 'active');
    showApp();
  } else {
    error.style.display = 'block';
    document.getElementById('password-input').value = '';
    document.getElementById('password-input').focus();
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !isLoggedIn) attemptLogin();
});

function checkSession() {
  if (sessionStorage.getItem('ihya_admin_session') === 'active') showApp();
}

function showApp() {
  isLoggedIn = true;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').style.display    = 'block';
  fetchEvents();
}

function logout() {
  sessionStorage.removeItem('ihya_admin_session');
  isLoggedIn = false;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').style.display    = 'none';
  document.getElementById('password-input').value = '';
}

// SUPABASE HELPERS
function sbHeaders() {
  return {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation'
  };
}

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...sbHeaders(), ...(options.headers || {}) }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// STORAGE
async function uploadFlyer(file) {
  const ext      = file.name.split('.').pop();
  const fileName = `flyer_${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/flyers/${fileName}`, {
    method:  'POST',
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  file.type,
      'x-upsert':      'true'
    },
    body: file
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Upload failed');
  }
  return `${SUPABASE_URL}/storage/v1/object/public/flyers/${fileName}`;
}

// FETCH & RENDER
async function fetchEvents() {
  try {
    const data = await sbFetch('events?order=date.asc.nullsfirst&select=*');
    allEvents  = data || [];
    renderEvents();
  } catch (e) {
    console.error('Fetch error:', e);
    toast('Could not load events: ' + e.message, 'error');
  }
}

function renderEvents() {
  const today     = new Date().toISOString().split('T')[0];
  const upcoming  = allEvents.filter(e => !e.is_recurring && e.date && e.date >= today);
  const recurring = allEvents.filter(e => e.is_recurring);
  const past      = allEvents.filter(e => !e.is_recurring && e.date && e.date < today).reverse();

  document.getElementById('upcoming-count').textContent  = `${upcoming.length} event${upcoming.length !== 1 ? 's' : ''}`;
  document.getElementById('recurring-count').textContent = `${recurring.length} recurring`;
  document.getElementById('past-count').textContent      = `${past.length} event${past.length !== 1 ? 's' : ''}`;

  renderList('upcoming-list',  upcoming,  '📅', 'No upcoming events. Use "+ Add Event" to create one.');
  renderList('recurring-list', recurring, '🔁', 'No recurring events yet.');
  renderList('past-list',      past,      '🗂️', 'No past events.');
}

function renderList(containerId, events, emptyIcon, emptyMsg) {
  const container = document.getElementById(containerId);
  if (!events.length) {
    container.innerHTML = `<div class="empty-state"><div class="icon">${emptyIcon}</div><p>${emptyMsg}</p></div>`;
    return;
  }
  container.innerHTML = events.map(ev => {
    const meta = ev.is_recurring
      ? `Every ${ev.recurring_day}${ev.time ? ' · ' + formatTime(ev.time) : ''}`
      : `${ev.date ? formatDate(ev.date) : ''}${ev.time ? ' · ' + formatTime(ev.time) : ''}`;

    return `
      <div class="event-card">
        ${ev.flyer_url
          ? `<img class="event-card-flyer" src="${ev.flyer_url}" alt="Flyer" />`
          : `<div class="event-card-flyer-placeholder">🕌</div>`}
        <div class="event-card-info">
          <div class="event-card-title">${escHtml(ev.title)}</div>
          <div class="event-card-meta">${meta}${ev.location ? ' · ' + escHtml(ev.location) : ''}</div>
          <div style="margin-top:0.35rem;">
            <span class="event-card-type">${escHtml(ev.type || 'Event')}</span>
            ${ev.is_recurring ? '<span class="event-card-recurring">🔁 Recurring</span>' : ''}
          </div>
        </div>
        <div class="event-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="editEvent('${ev.id}')">Edit</button>
          <button class="btn btn-danger btn-sm"    onclick="deleteEvent('${ev.id}', '${escHtml(ev.title)}')">Delete</button>
        </div>
      </div>`;
  }).join('');
}

// ADD / EDIT / SAVE
function editEvent(id) {
  const ev = allEvents.find(e => e.id === id);
  if (!ev) return;

  editingId = id;
  document.getElementById('form-title').textContent  = 'Edit Event';
  document.getElementById('edit-id').value           = id;
  document.getElementById('f-title').value           = ev.title       || '';
  document.getElementById('f-type').value            = ev.type        || 'Weekly Halaqa';
  document.getElementById('f-location').value        = ev.location    || '';
  document.getElementById('f-rsvp').value            = ev.rsvp_link   || '';
  document.getElementById('f-description').value     = ev.description || '';
  document.getElementById('f-flyer-url').value       = ev.flyer_url   || '';

  if (ev.is_recurring) {
    setSchedule('recurring');
    document.getElementById('f-day').value            = ev.recurring_day || 'Tuesday';
    document.getElementById('f-recurring-time').value = ev.time || '';
  } else {
    setSchedule('one-time');
    document.getElementById('f-date').value  = ev.date || '';
    document.getElementById('f-time').value  = ev.time || '';
  }

  const preview = document.getElementById('flyer-preview');
  if (ev.flyer_url) { preview.src = ev.flyer_url; preview.style.display = 'block'; }
  else              { preview.style.display = 'none'; }
  flyerFile = null;

  switchTab('add');
}

function resetForm() {
  editingId = null;
  flyerFile = null;
  setSchedule('one-time');
  document.getElementById('form-title').textContent  = 'Add New Event';
  document.getElementById('edit-id').value           = '';
  document.getElementById('f-title').value           = '';
  document.getElementById('f-type').value            = 'Weekly Halaqa';
  document.getElementById('f-date').value            = '';
  document.getElementById('f-time').value            = '';
  document.getElementById('f-location').value        = '';
  document.getElementById('f-rsvp').value            = '';
  document.getElementById('f-description').value     = '';
  document.getElementById('f-flyer-url').value       = '';
  document.getElementById('flyer-preview').style.display = 'none';
  document.getElementById('f-flyer').value           = '';
  switchTab('upcoming');
}

async function saveEvent() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { toast('Please enter an event title.', 'error'); return; }

  const isRecurring = scheduleType === 'recurring';
  const date = document.getElementById('f-date').value;
  if (!isRecurring && !date) { toast('Please select a date, or choose Weekly Recurring.', 'error'); return; }

  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    let flyerUrl = document.getElementById('f-flyer-url').value || null;
    if (flyerFile) {
      toast('Uploading flyer...', 'success');
      flyerUrl = await uploadFlyer(flyerFile);
    }

    const time = isRecurring
      ? document.getElementById('f-recurring-time').value || null
      : document.getElementById('f-time').value || null;

    const payload = {
      title:         title,
      type:          document.getElementById('f-type').value,
      is_recurring:  isRecurring,
      date:          isRecurring ? null : date,
      recurring_day: isRecurring ? document.getElementById('f-day').value : null,
      time:          time,
      location:      document.getElementById('f-location').value.trim() || null,
      rsvp_link:     document.getElementById('f-rsvp').value.trim() || null,
      description:   document.getElementById('f-description').value.trim() || null,
      flyer_url:     flyerUrl
    };

    if (editingId) {
      await sbFetch(`events?id=eq.${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      toast('Event updated!', 'success');
    } else {
      await sbFetch('events', { method: 'POST', body: JSON.stringify(payload) });
      toast('Event published!', 'success');
    }

    resetForm();
    await fetchEvents();
  } catch (e) {
    console.error('Save error:', e);
    toast('Error saving event: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Publish Event';
  }
}

async function deleteEvent(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
    await sbFetch(`events?id=eq.${id}`, { method: 'DELETE' });
    toast('Event deleted.', 'success');
    await fetchEvents();
  } catch (e) {
    toast('Error deleting: ' + e.message, 'error');
  }
}

// FLYER
function handleFlyerSelect(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('Flyer must be under 5MB.', 'error'); input.value = ''; return; }
  flyerFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('flyer-preview');
    preview.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function setupDragDrop() {
  const zone = document.getElementById('flyer-drop-zone');
  if (!zone) return;
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById('f-flyer').files = dt.files;
      handleFlyerSelect(document.getElementById('f-flyer'));
    }
  });
}

// TABS
function switchTab(name) {
  const names = ['upcoming', 'recurring', 'past', 'add'];
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', names[i] === name));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
  if (name !== 'add') { editingId = null; flyerFile = null; }
}

// TOAST
let toastTimer;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// HELPERS
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday:'short', month:'long', day:'numeric', year:'numeric' });
}
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h % 12) || 12)}:${String(m).padStart(2,'0')} ${ampm}`;
}
