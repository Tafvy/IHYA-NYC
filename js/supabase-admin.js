/**
 * IHYA NYC - Supabase Admin JS
 * Handles: login, events CRUD, flyer image uploads
 * No serverless functions needed - talks directly to Supabase REST API
 */

// PASSWORD (SHA-256 hash of "ihya26")
const PASSWORD_HASH = '460b33920fa4238f8bc78abbe86cc61c2c404567cc3a13887a6c3a9be81eab23';

// SUPABASE CREDENTIALS - pre-filled, admins don't need to configure anything
const DEFAULT_SUPABASE_URL = 'https://dpinugfkomjxybdixsbz.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_HXKlYPpT9tisbt9qd06rWg_E-FAbSa0';

let SUPABASE_URL = DEFAULT_SUPABASE_URL;
let SUPABASE_KEY = DEFAULT_SUPABASE_KEY;

// STATE
let allEvents  = [];
let editingId  = null;
let flyerFile  = null;
let isLoggedIn = false;

// INIT
window.addEventListener('DOMContentLoaded', () => {
  loadSupabaseConfig();
  checkSession();
  setupDragDrop();
});

function loadSupabaseConfig() {
  SUPABASE_URL = localStorage.getItem('ihya_sb_url') || DEFAULT_SUPABASE_URL;
  SUPABASE_KEY = localStorage.getItem('ihya_sb_key') || DEFAULT_SUPABASE_KEY;
  updateSetupBanner();
}

function updateSetupBanner() {
  const banner = document.getElementById('setup-banner');
  if (banner) {
    // Banner is only shown if both credentials are missing - which won't happen now
    banner.style.display = (SUPABASE_URL && SUPABASE_KEY) ? 'none' : 'flex';
  }
}

function checkSession() {
  const session = sessionStorage.getItem('ihya_admin_session');
  if (session === 'active') {
    showApp();
  }
}

// AUTH
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !isLoggedIn) attemptLogin();
});

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

// SUPABASE CONFIG MODAL (kept for manual override if ever needed)
function showConfig() {
  document.getElementById('cfg-url').value = SUPABASE_URL;
  document.getElementById('cfg-key').value = SUPABASE_KEY;
  document.getElementById('config-overlay').classList.add('show');
}

function hideConfig() {
  document.getElementById('config-overlay').classList.remove('show');
}

function saveConfig() {
  const url = document.getElementById('cfg-url').value.trim().replace(/\/$/, '');
  const key = document.getElementById('cfg-key').value.trim();

  if (!url || !key) {
    toast('Please enter both the URL and key.', 'error');
    return;
  }

  localStorage.setItem('ihya_sb_url', url);
  localStorage.setItem('ihya_sb_key', key);
  SUPABASE_URL = url;
  SUPABASE_KEY = key;
  updateSetupBanner();
  hideConfig();
  toast('Supabase connected! Loading events...', 'success');
  fetchEvents();
}

// SUPABASE API HELPERS
function sbHeaders(extra = {}) {
  return {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
    ...extra
  };
}

async function sbFetch(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    toast('Supabase is not configured yet.', 'error');
    throw new Error('Not configured');
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: sbHeaders(options.headers || {})
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// STORAGE UPLOAD
async function uploadFlyer(file) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Not configured');

  const ext      = file.name.split('.').pop();
  const fileName = `flyer_${Date.now()}.${ext}`;
  const bucket   = 'flyers';

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`, {
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

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;
}

// FETCH EVENTS
async function fetchEvents() {
  try {
    const data = await sbFetch('events?order=date.asc&select=*');
    allEvents  = data || [];
    renderEvents();
  } catch (e) {
    if (e.message === 'Not configured') return;
    renderEvents();
    console.error('Fetch error:', e);
  }
}

function renderEvents() {
  const today    = new Date().toISOString().split('T')[0];
  const upcoming = allEvents.filter(e => e.date >= today);
  const past     = allEvents.filter(e => e.date  < today).reverse();

  document.getElementById('upcoming-count').textContent =
    `${upcoming.length} event${upcoming.length !== 1 ? 's' : ''}`;
  document.getElementById('past-count').textContent =
    `${past.length} event${past.length !== 1 ? 's' : ''}`;

  renderList('upcoming-list', upcoming, true);
  renderList('past-list',     past,     false);
}

function renderList(containerId, events, isUpcoming) {
  const container = document.getElementById(containerId);
  if (!events.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">${isUpcoming ? '📅' : '🗂️'}</div>
        <p>${isUpcoming ? 'No upcoming events. Use "Add Event" to create one.' : 'No past events recorded.'}</p>
      </div>`;
    return;
  }

  container.innerHTML = events.map(ev => `
    <div class="event-card">
      ${ev.flyer_url
        ? `<img class="event-card-flyer" src="${ev.flyer_url}" alt="Flyer" />`
        : `<div class="event-card-flyer-placeholder">🕌</div>`}
      <div class="event-card-info">
        <div class="event-card-title">${escHtml(ev.title)}</div>
        <div class="event-card-meta">
          ${formatDate(ev.date)}${ev.time ? ' - ' + formatTime(ev.time) : ''}
          ${ev.location ? ' - ' + escHtml(ev.location) : ''}
        </div>
        <div class="event-card-type">${escHtml(ev.type || 'Event')}</div>
      </div>
      <div class="event-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="editEvent('${ev.id}')">Edit</button>
        <button class="btn btn-danger btn-sm"    onclick="deleteEvent('${ev.id}', '${escHtml(ev.title)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// ADD / EDIT / SAVE
function editEvent(id) {
  const ev = allEvents.find(e => e.id === id);
  if (!ev) return;

  editingId = id;
  document.getElementById('form-title').textContent   = 'Edit Event';
  document.getElementById('edit-id').value            = id;
  document.getElementById('f-title').value            = ev.title       || '';
  document.getElementById('f-type').value             = ev.type        || 'Weekly Halaqa';
  document.getElementById('f-date').value             = ev.date        || '';
  document.getElementById('f-time').value             = ev.time        || '';
  document.getElementById('f-location').value         = ev.location    || '';
  document.getElementById('f-rsvp').value             = ev.rsvp_link   || '';
  document.getElementById('f-description').value      = ev.description || '';
  document.getElementById('f-flyer-url').value        = ev.flyer_url   || '';

  const preview = document.getElementById('flyer-preview');
  if (ev.flyer_url) {
    preview.src           = ev.flyer_url;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
  flyerFile = null;

  switchTab('add');
}

function resetForm() {
  editingId = null;
  flyerFile = null;
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
  const date  = document.getElementById('f-date').value;

  if (!title) { toast('Please enter an event title.', 'error'); return; }
  if (!date)  { toast('Please select a date.', 'error'); return; }

  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    let flyerUrl = document.getElementById('f-flyer-url').value || null;

    if (flyerFile) {
      toast('Uploading flyer...', 'success');
      flyerUrl = await uploadFlyer(flyerFile);
    }

    const payload = {
      title:       title,
      type:        document.getElementById('f-type').value,
      date:        date,
      time:        document.getElementById('f-time').value || null,
      location:    document.getElementById('f-location').value.trim() || null,
      rsvp_link:   document.getElementById('f-rsvp').value.trim() || null,
      description: document.getElementById('f-description').value.trim() || null,
      flyer_url:   flyerUrl
    };

    if (editingId) {
      await sbFetch(`events?id=eq.${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      toast('Event updated!', 'success');
    } else {
      await sbFetch('events', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
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
    toast('Error deleting event: ' + e.message, 'error');
  }
}

// FLYER UPLOAD UI
function handleFlyerSelect(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toast('Flyer must be under 5MB.', 'error');
    input.value = '';
    return;
  }
  flyerFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('flyer-preview');
    preview.src           = e.target.result;
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
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    const names = ['upcoming', 'past', 'add'];
    b.classList.toggle('active', names[i] === name);
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
  if (name !== 'add') resetFormState();
}

function resetFormState() {
  if (!editingId) return;
  editingId = null;
  flyerFile = null;
  document.getElementById('form-title').textContent = 'Add New Event';
  document.getElementById('edit-id').value = '';
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
