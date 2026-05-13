/**
 * IHYA NYC - Supabase Admin JS
 */

const PASSWORD_HASH = '460b33920fa4238f8bc78abbe86cc61c2c404567cc3a13887a6c3a9be81eab23';
const SUPABASE_URL  = 'https://dpinugfkomjxybdixsbz.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaW51Z2Zrb21qeHliZGl4c2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDAyNjksImV4cCI6MjA5MTkxNjI2OX0.-BUEodcxcDF1SiFn-QHJq70f6yl7KrX_RPgpo_Q7zgM';

let allEvents    = [];
let editingId    = null;
let flyerFile    = null;
let isLoggedIn   = false;
let scheduleType = 'one-time';

// INIT
window.addEventListener('DOMContentLoaded', () => {
  checkSession();
  setupDragDrop();
});

// Get time value from the 3 dropdowns (hour, minute, ampm)
function getTimeValue(prefix) {
  const h    = document.getElementById(prefix + '-hour').value;
  const m    = document.getElementById(prefix + '-min').value;
  const ampm = document.getElementById(prefix + '-ampm').value;
  if (!h) return null;
  let hour24 = parseInt(h);
  if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
  if (ampm === 'AM' && hour24 === 12) hour24 = 0;
  return `${String(hour24).padStart(2,'0')}:${m}`;
}

// Set time dropdowns from a "HH:MM" string
function setTimeValue(prefix, timeStr) {
  if (!timeStr) {
    document.getElementById(prefix + '-hour').value = '';
    document.getElementById(prefix + '-min').value  = '00';
    document.getElementById(prefix + '-ampm').value = 'AM';
    return;
  }
  const [h, m] = timeStr.split(':').map(Number);
  const ampm   = h >= 12 ? 'PM' : 'AM';
  const hour12 = (h % 12) || 12;
  document.getElementById(prefix + '-hour').value = String(hour12);
  document.getElementById(prefix + '-min').value  = String(m).padStart(2,'0');
  document.getElementById(prefix + '-ampm').value = ampm;
}

// SCHEDULE TOGGLE
function setSchedule(type) {
  scheduleType = type;
  document.getElementById('btn-one-time').classList.toggle('active', type === 'one-time');
  document.getElementById('btn-recurring').classList.toggle('active', type === 'recurring');
  document.getElementById('date-fields').style.display      = type === 'one-time'  ? 'contents' : 'none';
  document.getElementById('recurring-fields').style.display = type === 'recurring' ? 'contents' : 'none';
}

// AUTH
async function sha256(msg) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function attemptLogin() {
  const input = document.getElementById('password-input').value;
  const error = document.getElementById('login-error');
  if (await sha256(input) === PASSWORD_HASH) {
    error.style.display = 'none';
    sessionStorage.setItem('ihya_admin_session', 'active');
    showApp();
  } else {
    error.style.display = 'block';
    document.getElementById('password-input').value = '';
    document.getElementById('password-input').focus();
  }
}

document.addEventListener('keydown', e => { if (e.key === 'Enter' && !isLoggedIn) attemptLogin(); });

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

// SUPABASE
function sbHeaders() {
  return { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
}

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...sbHeaders(), ...(options.headers||{}) } });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || `HTTP ${res.status}`); }
  if (res.status === 204) return null;
  return res.json();
}

async function uploadFlyer(file) {
  const fileName = `flyer_${Date.now()}.${file.name.split('.').pop()}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/flyers/${fileName}`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type, 'x-upsert': 'true' },
    body: file
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || 'Upload failed'); }
  return `${SUPABASE_URL}/storage/v1/object/public/flyers/${fileName}`;
}

// FETCH & RENDER
async function fetchEvents() {
  try {
    const data = await sbFetch('events?order=date.asc.nullsfirst&select=*');
    allEvents  = data || [];
    renderEvents();
  } catch (e) {
    console.error(e);
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

function renderList(id, events, icon, msg) {
  const el = document.getElementById(id);
  if (!events.length) { el.innerHTML = `<div class="empty-state"><div class="icon">${icon}</div><p>${msg}</p></div>`; return; }
  el.innerHTML = events.map(ev => {
    const meta = ev.is_recurring
      ? `Every ${ev.recurring_day}${ev.time ? ' · ' + fmt(ev.time) : ''}`
      : `${ev.date ? fmtDate(ev.date) : ''}${ev.time ? ' · ' + fmt(ev.time) : ''}`;
    return `
      <div class="event-card">
        ${ev.flyer_url ? `<img class="event-card-flyer" src="${ev.flyer_url}" alt="Flyer" />` : `<div class="event-card-flyer-placeholder">🕌</div>`}
        <div class="event-card-info">
          <div class="event-card-title">${escHtml(ev.title)}</div>
          <div class="event-card-meta">${meta}${ev.location ? ' · ' + escHtml(ev.location) : ''}</div>
          <div style="margin-top:0.35rem;">
            <span class="event-card-type">${escHtml(ev.type || 'Event')}</span>
            ${ev.is_recurring ? '<span class="event-card-recurring">🔁 Recurring</span>' : ''}
            ${ev.pinned ? '<span class="event-card-recurring">📌 Pinned</span>' : ''}
          </div>
        </div>
        <div class="event-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="editEvent('${ev.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteEvent('${ev.id}','${escHtml(ev.title)}')">Delete</button>
        </div>
      </div>`;
  }).join('');
}

// FORM
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
  document.getElementById('f-pinned').checked        = ev.pinned      || false;
  document.getElementById('f-sort-order').value      = ev.sort_order  != null ? ev.sort_order : '';

  if (ev.is_recurring) {
    setSchedule('recurring');
    document.getElementById('f-day').value = ev.recurring_day || 'Tuesday';
    setTimeValue('f-rtime', ev.time);
  } else {
    setSchedule('one-time');
    document.getElementById('f-date').value = ev.date || '';
    setTimeValue('f-time', ev.time);
  }

  const preview = document.getElementById('flyer-preview');
  if (ev.flyer_url) { preview.src = ev.flyer_url; preview.style.display = 'block'; }
  else { preview.style.display = 'none'; }
  flyerFile = null;
  switchTab('add');
}

function resetForm() {
  editingId = null; flyerFile = null;
  setSchedule('one-time');
  ['form-title','edit-id','f-title','f-date','f-location','f-rsvp','f-description','f-flyer-url'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'form-title' ? '' : '';
  });
  document.getElementById('form-title').textContent = 'Add New Event';
  document.getElementById('f-type').value = 'Weekly Halaqa';
  setTimeValue('f-time', null);
  setTimeValue('f-rtime', null);
  document.getElementById('flyer-preview').style.display = 'none';
  document.getElementById('f-flyer').value = '';
  switchTab('upcoming');
}

async function saveEvent() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { toast('Please enter an event title.', 'error'); return; }
  const isRecurring = scheduleType === 'recurring';
  const date = document.getElementById('f-date').value;
  if (!isRecurring && !date) { toast('Please select a date, or choose Weekly Recurring.', 'error'); return; }

  const btn = document.getElementById('save-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...';

  try {
    let flyerUrl = document.getElementById('f-flyer-url').value || null;
    if (flyerFile) { toast('Uploading flyer...', 'success'); flyerUrl = await uploadFlyer(flyerFile); }

    const time = isRecurring ? getTimeValue('f-rtime') : getTimeValue('f-time');

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
      pinned:        document.getElementById('f-pinned').checked,
      sort_order:    document.getElementById('f-sort-order').value !== '' ? parseInt(document.getElementById('f-sort-order').value) : null,
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
    console.error(e);
    toast('Error saving event: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = 'Publish Event';
  }
}

async function deleteEvent(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
    await sbFetch(`events?id=eq.${id}`, { method: 'DELETE' });
    toast('Event deleted.', 'success');
    await fetchEvents();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

// FLYER
function handleFlyerSelect(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5*1024*1024) { toast('Flyer must be under 5MB.', 'error'); input.value=''; return; }
  flyerFile = file;
  const reader = new FileReader();
  reader.onload = e => { const p = document.getElementById('flyer-preview'); p.src = e.target.result; p.style.display = 'block'; };
  reader.readAsDataURL(file);
}

function setupDragDrop() {
  const zone = document.getElementById('flyer-drop-zone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer(); dt.items.add(file);
      document.getElementById('f-flyer').files = dt.files;
      handleFlyerSelect(document.getElementById('f-flyer'));
    }
  });
}

// TABS
function switchTab(name) {
  const names = ['upcoming','recurring','past','links','add'];
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', names[i] === name));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
  if (name === 'links') fetchLinks();
  if (name !== 'add') { editingId = null; flyerFile = null; }
}

// TOAST
let toastTimer;
function toast(msg, type='success') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// HELPERS
function escHtml(s) { if(!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDate(s) { if(!s) return ''; const d=new Date(s+'T00:00:00'); return d.toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric',year:'numeric'}); }
function fmt(t) { if(!t) return ''; const [h,m]=t.split(':').map(Number); return `${((h%12)||12)}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; }

// ── LINKS MANAGEMENT ────────────────────────────────────────────────────────

let allLinks  = [];
let editingLinkId = null;

async function fetchLinks() {
  try {
    const data = await sbFetch('links?order=sort_order.asc&select=*');
    allLinks = data || [];
    renderLinks();
  } catch (e) {
    console.error('Links fetch error:', e);
  }
}

function renderLinks() {
  const el = document.getElementById('links-list-admin');
  if (!el) return;
  document.getElementById('links-count').textContent = `${allLinks.length} link${allLinks.length !== 1 ? 's' : ''}`;

  if (!allLinks.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">🔗</div><p>No links yet. Add your first link below.</p></div>`;
    return;
  }

  el.innerHTML = allLinks.map(l => `
    <div class="event-card">
      <div class="event-card-flyer-placeholder" style="font-size:1.8rem">${l.emoji || '🔗'}</div>
      <div class="event-card-info">
        <div class="event-card-title">${escHtml(l.title)}</div>
        <div class="event-card-meta" style="word-break:break-all">${escHtml(l.url)}</div>
        <div style="margin-top:0.35rem">
          <span class="event-card-type">Order: ${l.sort_order || 0}</span>
          ${l.featured ? '<span class="event-card-recurring">⭐ Featured</span>' : ''}
        </div>
      </div>
      <div class="event-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="editLink('${l.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteLink('${l.id}','${escHtml(l.title)}')">Delete</button>
      </div>
    </div>`).join('');
}

function editLink(id) {
  const l = allLinks.find(x => x.id === id);
  if (!l) return;
  editingLinkId = id;
  document.getElementById('lf-title').value      = l.title      || '';
  document.getElementById('lf-url').value        = l.url        || '';
  document.getElementById('lf-emoji').value      = l.emoji      || '';
  document.getElementById('lf-order').value      = l.sort_order || 0;
  document.getElementById('lf-featured').checked = l.featured   || false;
  document.getElementById('link-form-title').textContent = 'Edit Link';
  document.getElementById('link-form-area').style.display = 'block';
  document.getElementById('link-form-area').scrollIntoView({ behavior: 'smooth' });
}

function showLinkForm() {
  editingLinkId = null;
  document.getElementById('lf-title').value      = '';
  document.getElementById('lf-url').value        = '';
  document.getElementById('lf-emoji').value      = '';
  document.getElementById('lf-order').value      = allLinks.length;
  document.getElementById('lf-featured').checked = false;
  document.getElementById('link-form-title').textContent = 'Add New Link';
  document.getElementById('link-form-area').style.display = 'block';
  document.getElementById('link-form-area').scrollIntoView({ behavior: 'smooth' });
}

function hideLinkForm() {
  editingLinkId = null;
  document.getElementById('link-form-area').style.display = 'none';
}

async function saveLink() {
  const title = document.getElementById('lf-title').value.trim();
  const url   = document.getElementById('lf-url').value.trim();
  if (!title) { toast('Please enter a link title.', 'error'); return; }
  if (!url)   { toast('Please enter a URL.', 'error'); return; }

  const btn = document.getElementById('save-link-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving...';

  const payload = {
    title:      title,
    url:        url,
    emoji:      document.getElementById('lf-emoji').value.trim() || null,
    sort_order: parseInt(document.getElementById('lf-order').value) || 0,
    featured:   document.getElementById('lf-featured').checked
  };

  try {
    if (editingLinkId) {
      await sbFetch(`links?id=eq.${editingLinkId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      toast('Link updated!', 'success');
    } else {
      await sbFetch('links', { method: 'POST', body: JSON.stringify(payload) });
      toast('Link added!', 'success');
    }
    hideLinkForm();
    await fetchLinks();
  } catch (e) {
    toast('Error saving link: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = 'Save Link';
  }
}

async function deleteLink(id, title) {
  if (!confirm(`Delete "${title}"?`)) return;
  try {
    await sbFetch(`links?id=eq.${id}`, { method: 'DELETE' });
    toast('Link deleted.', 'success');
    await fetchLinks();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}
