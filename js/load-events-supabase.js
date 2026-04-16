/**
 * IHYA NYC — Supabase Events Loader
 * Reads from Supabase, renders using IHYA's exact CSS classes.
 */

const SUPABASE_URL = 'https://dpinugfkomjxybdixsbz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaW51Z2Zrb21qeHliZGl4c2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDAyNjksImV4cCI6MjA5MTkxNjI2OX0.-BUEodcxcDF1SiFn-QHJq70f6yl7KrX_RPgpo_Q7zgM';

async function loadEvents() {
  try {
    const today = new Date().toISOString().split('T')[0];
    // Fetch upcoming one-time events AND all recurring events
    const [oneTime, recurring] = await Promise.all([
      sbGet(`events?is_recurring=eq.false&date=gte.${today}&order=date.asc&select=*`),
      sbGet(`events?is_recurring=eq.true&select=*`)
    ]);
    const events = [...(recurring || []), ...(oneTime || [])];
    renderAll(events);
  } catch (err) {
    console.error('Failed to load events:', err);
    showError();
  }
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

function buildCard(ev, compact) {
  const d = ev.date ? new Date(ev.date + 'T00:00:00') : null;
  const dateNum   = d ? d.getDate() : '';
  const monthStr  = d ? d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
  const dateStr   = ev.is_recurring
    ? `Every ${ev.recurring_day}`
    : (d ? d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }) : '');
  const timeStr   = ev.time ? formatTime(ev.time) : '';
  const desc      = ev.description || '';
  const shortDesc = compact && desc.length > 80 ? desc.substring(0, 80) + '...' : desc;
  const typeClass = (ev.type || '').toLowerCase().includes('weekly') ? 'weekly' : '';

  // Flyer or placeholder
  const flyerHTML = ev.flyer_url
    ? `<img src="${ev.flyer_url}" alt="${escHtml(ev.title)}" class="event-flyer" />`
    : `<div class="event-flyer-placeholder">
         <span class="date">${ev.is_recurring ? '🔁' : dateNum}</span>
         <span class="month">${ev.is_recurring ? 'WEEKLY' : monthStr}</span>
         <span class="title">${escHtml(ev.title)}</span>
       </div>`;

  // Meta items
  const datetimeMeta = (dateStr || timeStr) ? `
    <div class="event-meta-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span>${[dateStr, timeStr].filter(Boolean).join(' · ')}</span>
    </div>` : '';

  const locationMeta = ev.location ? `
    <div class="event-meta-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span>${escHtml(ev.location)}</span>
    </div>` : '';

  const rsvpMeta = ev.rsvp_link ? `
    <div class="event-meta-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      <a href="${escHtml(ev.rsvp_link)}" target="_blank" rel="noopener" style="color:var(--ihya-green);font-weight:500;">RSVP / Register</a>
    </div>` : '';

  return `
    <div class="event-card">
      ${flyerHTML}
      <div class="event-details">
        <span class="event-tag ${typeClass}">${escHtml(ev.type || 'Event')}</span>
        <h3>${escHtml(ev.title)}</h3>
        ${shortDesc ? `<p>${escHtml(shortDesc)}</p>` : ''}
        <div class="event-meta">
          ${datetimeMeta}
          ${locationMeta}
          ${rsvpMeta}
        </div>
      </div>
    </div>`;
}

function renderAll(events) {
  // Desktop grid
  const grid = document.getElementById('eventsGrid');
  if (grid) {
    grid.innerHTML = events.length
      ? events.map(ev => buildCard(ev, false)).join('')
      : `<div style="text-align:center;padding:3rem 1rem;color:#6b6b6b;grid-column:1/-1;"><p>No upcoming events. Check back soon!</p></div>`;
  }

  // Mobile carousel
  const carousel = document.getElementById('eventsCarousel');
  const dots     = document.getElementById('carouselDots');
  if (carousel) {
    if (!events.length) {
      carousel.innerHTML = `<div style="text-align:center;padding:3rem 1rem;color:#6b6b6b;"><p>No upcoming events. Check back soon!</p></div>`;
      return;
    }
    carousel.innerHTML = events.map(ev => buildCard(ev, true)).join('');

    if (dots) {
      dots.innerHTML = '';
      events.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to event ${i + 1}`);
        dot.onclick = () => {
          const cards = carousel.querySelectorAll('.event-card');
          if (cards[i]) carousel.scrollTo({ left: cards[i].offsetLeft - 20, behavior: 'smooth' });
        };
        dots.appendChild(dot);
      });

      carousel.addEventListener('scroll', () => {
        const cards = carousel.querySelectorAll('.event-card');
        if (!cards.length) return;
        const idx = Math.round(carousel.scrollLeft / (cards[0].offsetWidth + 16));
        dots.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
      });
    }
  }
}

function showError() {
  const msg = `<div style="text-align:center;padding:2rem;color:#6b6b6b;"><p>Events temporarily unavailable. Check our Instagram for updates.</p></div>`;
  const grid = document.getElementById('eventsGrid');
  const carousel = document.getElementById('eventsCarousel');
  if (grid) grid.innerHTML = msg;
  if (carousel) carousel.innerHTML = msg;
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h % 12) || 12)}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadEvents);
} else {
  loadEvents();
}
