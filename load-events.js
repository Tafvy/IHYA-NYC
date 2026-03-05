// IHYA NYC - Events Loader for Main Website
// This script loads events from data/events.json and displays them on the homepage

(function() {
    'use strict';
    
    const EVENTS_DATA_URL = 'data/events.json';
    
    // Load and display events
    async function loadEvents() {
        try {
            const response = await fetch(EVENTS_DATA_URL);
            if (!response.ok) {
                throw new Error('Failed to load events');
            }
            
            const data = await response.json();
            const events = data.events || [];
            
            displayEvents(events);
            
        } catch (error) {
            console.error('Error loading events:', error);
            displayError();
        }
    }
    
    function displayEvents(events) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        // Filter and sort upcoming events
        const upcomingEvents = events
            .filter(event => new Date(event.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Get featured events
        const featuredEvents = upcomingEvents.filter(e => e.featured);
        
        // Display in events section
        displayEventCards(upcomingEvents);
        
        // Display featured event if exists
        if (featuredEvents.length > 0) {
            displayFeaturedEvent(featuredEvents[0]);
        }
    }
    
    function displayEventCards(events) {
        const container = document.getElementById('events-container');
        if (!container) return;
        
        if (events.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--ihya-text-light);">
                    <p style="font-size: 1.1rem;">No upcoming events at this time.</p>
                    <p style="margin-top: 0.5rem;">Check back soon for new programs!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = events.map(event => createEventCard(event)).join('');
    }
    
    function createEventCard(event) {
        const eventDate = new Date(event.date);
        const monthShort = eventDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const day = eventDate.getDate();
        
        return `
            <div class="event-card">
                <div class="event-date-badge">
                    <div class="event-month">${monthShort}</div>
                    <div class="event-day">${day}</div>
                </div>
                <div class="event-image">
                    <img src="${event.flyer}" alt="${event.title}">
                    ${event.featured ? '<div class="featured-badge">Featured</div>' : ''}
                </div>
                <div class="event-content">
                    <div class="event-type">${getEventTypeLabel(event.type)}</div>
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-meta">
                        <span class="event-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${formatEventDate(event.date)}
                        </span>
                        <span class="event-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${event.time}
                        </span>
                        <span class="event-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            ${event.location}
                        </span>
                    </div>
                    <p class="event-description">${event.description}</p>
                    ${event.speaker ? `
                        <div class="event-speaker">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            ${event.speaker}
                        </div>
                    ` : ''}
                    ${event.registrationLink ? `
                        <a href="${event.registrationLink}" target="_blank" class="event-register-btn">
                            Register Now →
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    function displayFeaturedEvent(event) {
        const container = document.getElementById('featured-event');
        if (!container) return;
        
        container.innerHTML = `
            <div class="featured-event-content">
                <div class="featured-event-image">
                    <img src="${event.flyer}" alt="${event.title}">
                </div>
                <div class="featured-event-info">
                    <div class="featured-badge-lg">✨ Featured Event</div>
                    <h2>${event.title}</h2>
                    <div class="featured-event-meta">
                        <span>📅 ${formatEventDate(event.date)}</span>
                        <span>🕐 ${event.time}</span>
                        <span>📍 ${event.location}</span>
                    </div>
                    <p>${event.description}</p>
                    ${event.speaker ? `<p class="featured-speaker">With ${event.speaker}</p>` : ''}
                    ${event.registrationLink ? `
                        <a href="${event.registrationLink}" target="_blank" class="btn-primary">
                            Register Now
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    function displayError() {
        const container = document.getElementById('events-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--ihya-text-light);">
                    <p>Unable to load events at this time.</p>
                    <p style="margin-top: 0.5rem;">Please try again later.</p>
                </div>
            `;
        }
    }
    
    function formatEventDate(dateString) {
        const date = new Date(dateString);
        const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    function getEventTypeLabel(type) {
        const labels = {
            'halaqa': 'Weekly Halaqa',
            'sisters': 'Sisters Halaqa',
            'community': 'Community Event',
            'social': 'IHYA Social',
            'arabic': 'Arabic Class',
            'special': 'Special Event'
        };
        return labels[type] || type;
    }
    
    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadEvents);
    } else {
        loadEvents();
    }
    
})();
