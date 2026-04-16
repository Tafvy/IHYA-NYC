/**
 * IHYA NYC — Supabase Events Loader
 * Drop this in place of your old load-events.js
 * Reads events from Supabase and renders them on the public site.
 *
 * SETUP: Replace the two values below with your Supabase project details.
 */

const SUPABASE_URL = 'https://dpinugfkomjxybdixsbz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaW51Z2Zrb21qeHliZGl4c2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDAyNjksImV4cCI6MjA5MTkxNjI2OX0.-BUEodcxcDF1SiFn-QHJq70f6yl7KrX_RPgpo_Q7zgM';

async function loadEvents() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?date=gte.${today}&order=date.asc&select=*`,
      {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    const events = await res.json();
    renderEvents(events);
  } catch (err) {
    console.error('Failed to load events:', err);
    renderEventsError();
  }
}

function renderEvents(events) {
  // Try common container IDs — adjust to match your index.html
  const container =
    document.getElementById('eventsGrid') ||
    document.getElementById('eventsCarousel') ||
    document.querySelector('.events-grid') ||
    document.querySelector('.events-list');

  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="no-events" style="text-align:center;padding:3rem 1rem;color:#6b6b6b;">
        <p>No upcoming events. Check back soon!</p>
      </div>`;
    return;
  }

  container.innerHTML = events.map(ev => buildEventCard(ev)).join('');
}

function buildEventCard(ev) {
  const dateStr = formatDate(ev.date);
  const timeStr = ev.time ? formatTime(ev.time) : '';
  const rsvpBtn = ev.rsvp_link
    ? `<a href="${ev.rsvp_link}" target="_blank" rel="noopener" class="event-rsvp-btn">RSVP</a>`
    : '';
  const flyer = ev.flyer_url
    ? `<div class="event-flyer"><img src="${ev.flyer_url}" alt="${escHtml(ev.title)} flyer" loading="lazy" /></div>`
    : '';

  return `
    <div class="event-card" data-type="${escHtml(ev.type || '')}">
      ${flyer}
      <div class="event-content">
        <div class="event-type">${escHtml(ev.type || 'Event')}</div>
        <h3 class="event-title">${escHtml(ev.title)}</h3>
        <div class="event-meta">
          <span class="event-date">📅 ${dateStr}</span>
          ${timeStr ? `<span class="event-time">🕐 ${timeStr}</span>` : ''}
          ${ev.location ? `<span class="event-location">📍 ${escHtml(ev.location)}</span>` : ''}
        </div>
        ${ev.description ? `<p class="event-description">${escHtml(ev.description)}</p>` : ''}
        ${rsvpBtn}
      </div>
    </div>`;
}

function renderEventsError() {
  const container =
    document.getElementById('eventsGrid') ||
    document.getElementById('eventsCarousel') ||
    document.querySelector('.events-grid') ||
    document.querySelector('.events-list');

  if (container) {
    container.innerHTML = `
      <div style="text-align:center;padding:2rem;color:#6b6b6b;">
        <p>Events are temporarily unavailable. Please check our Instagram for updates.</p>
      </div>`;
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h % 12) || 12)}:${String(m).padStart(2,'0')} ${ampm}`;
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadEvents);
} else {
  loadEvents();
}
