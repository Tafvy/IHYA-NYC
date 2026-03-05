// IHYA NYC Admin System - Netlify Version
// Fully automated - admins never see GitHub!

// Configuration
const CONFIG = {
    passwordHash: 'f8c3bf62a9aa3e6fc1619c250e48abe7519373d3edf41be62eb5dc45199af2ef', // SHA-256 of 'ihya26'
    sessionDuration: 3600000, // 1 hour
    maxLoginAttempts: 5,
    apiEndpoint: '/.netlify/functions/update-events' // Netlify function endpoint
};

// State
let currentEvents = [];
let editingEventId = null;
let currentFlyerFile = null;
let currentFlyerData = null;
let loginAttempts = 0;

// ==================== AUTHENTICATION ====================

function hashPassword(password) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
        .then(hash => Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(''));
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('passwordInput').value;
    const errorEl = document.getElementById('loginError');
    
    if (loginAttempts >= CONFIG.maxLoginAttempts) {
        errorEl.textContent = 'Too many failed attempts. Please refresh and try again.';
        return;
    }
    
    const hashedInput = await hashPassword(password);
    
    if (hashedInput === CONFIG.passwordHash) {
        const session = {
            authenticated: true,
            timestamp: Date.now()
        };
        sessionStorage.setItem('ihya_admin_session', JSON.stringify(session));
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        loadEvents();
    } else {
        loginAttempts++;
        errorEl.textContent = `Incorrect password. ${CONFIG.maxLoginAttempts - loginAttempts} attempts remaining.`;
        document.getElementById('passwordInput').value = '';
        
        if (loginAttempts >= CONFIG.maxLoginAttempts) {
            errorEl.textContent = 'Too many failed attempts. Please refresh the page.';
            document.getElementById('passwordInput').disabled = true;
        }
    }
});

function checkSession() {
    const session = sessionStorage.getItem('ihya_admin_session');
    if (session) {
        const sessionData = JSON.parse(session);
        const now = Date.now();
        
        if (sessionData.authenticated && (now - sessionData.timestamp) < CONFIG.sessionDuration) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            loadEvents();
        } else {
            sessionStorage.removeItem('ihya_admin_session');
        }
    }
}

function logout() {
    sessionStorage.removeItem('ihya_admin_session');
    location.reload();
}

// ==================== API CALLS ====================

async function callNetlifyFunction(action, eventData, eventId = null, flyerData = null) {
    const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action,
            eventData,
            eventId,
            flyerData
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
}

// ==================== EVENTS MANAGEMENT ====================

async function loadEvents() {
    try {
        showLoading(true);
        
        // Fetch events.json from your GitHub repo (public read)
        const response = await fetch('https://raw.githubusercontent.com/Tafvy/IHYA-NYC/main/data/events.json');
        
        if (response.ok) {
            const data = await response.json();
            currentEvents = data.events || [];
        } else {
            currentEvents = [];
        }
        
        displayEvents();
        updateStats();
        
    } catch (error) {
        console.error('Error loading events:', error);
        showToast('Failed to load events. Using empty state.', 'error');
        currentEvents = [];
        displayEvents();
    } finally {
        showLoading(false);
    }
}

function displayEvents() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const upcoming = currentEvents.filter(e => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const past = currentEvents.filter(e => new Date(e.date) < now)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    
    displayEventsList('eventsList', upcoming, 'No upcoming events scheduled.');
    displayEventsList('pastEventsList', past, 'No past events.');
}

function displayEventsList(containerId, events, emptyMessage) {
    const container = document.getElementById(containerId);
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="event-card">
            <img src="${event.flyer}" alt="${event.title}" class="event-flyer-thumb" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'120\\' height=\\'120\\'%3E%3Crect fill=\\'%23E8E2D9\\' width=\\'120\\' height=\\'120\\'/%3E%3C/svg%3E'">
            <div class="event-info">
                <h3>${event.title}</h3>
                <div class="event-meta">
                    <span>📅 ${formatDate(event.date)}</span>
                    <span>🕐 ${event.time}</span>
                    <span>📍 ${event.location}</span>
                </div>
                <span class="event-type-badge badge-${event.type}">${getEventTypeLabel(event.type)}</span>
                ${event.speaker ? `<p style="margin-top: 0.5rem; color: var(--ihya-text-light);">👤 ${event.speaker}</p>` : ''}
            </div>
            <div class="event-actions">
                <button onclick="editEvent('${event.id}')" class="btn-edit">✏️ Edit</button>
                <button onclick="deleteEvent('${event.id}')" class="btn-delete">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const upcoming = currentEvents.filter(e => new Date(e.date) >= now);
    
    document.getElementById('upcomingCount').textContent = upcoming.length;
    document.getElementById('totalEvents').textContent = currentEvents.length;
    document.getElementById('flyerCount').textContent = currentEvents.length;
}

// ==================== EVENT FORM ====================

function showAddEvent() {
    editingEventId = null;
    document.getElementById('formTitle').textContent = 'Add New Event';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    resetFlyerUpload();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;
    
    showView('eventFormView');
}

function editEvent(eventId) {
    const event = currentEvents.find(e => e.id === eventId);
    if (!event) return;
    
    editingEventId = eventId;
    document.getElementById('formTitle').textContent = 'Edit Event';
    
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventType').value = event.type;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventLocation').value = event.location;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventSpeaker').value = event.speaker || '';
    document.getElementById('eventRegistration').value = event.registrationLink || '';
    document.getElementById('featuredEvent').checked = event.featured || false;
    
    if (event.flyer) {
        showFlyerPreview(event.flyer);
    }
    
    showView('eventFormView');
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) {
        return;
    }
    
    try {
        showLoading(true);
        
        await callNetlifyFunction('delete', null, eventId);
        
        showToast('Event deleted successfully!', 'success');
        
        setTimeout(() => {
            loadEvents();
        }, 1000);
        
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Failed to delete event: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== FLYER UPLOAD ====================

function setupFlyerUpload() {
    const uploadArea = document.getElementById('flyerUploadArea');
    const fileInput = document.getElementById('flyerInput');
    
    uploadArea.addEventListener('click', () => {
        if (!document.getElementById('flyerPreview').style.display || 
            document.getElementById('flyerPreview').style.display === 'none') {
            fileInput.click();
        }
    });
    
    fileInput.addEventListener('change', handleFlyerSelect);
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--ihya-green)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--ihya-sand)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--ihya-sand)';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFlyer(file);
        }
    });
}

function handleFlyerSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFlyer(file);
    }
}

function processFlyer(file) {
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large. Maximum size is 5MB.', 'error');
        return;
    }
    
    currentFlyerFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        currentFlyerData = e.target.result;
        showFlyerPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

function showFlyerPreview(imageSrc) {
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('flyerPreview').style.display = 'block';
    document.getElementById('flyerPreviewImg').src = imageSrc;
}

function removeFlyer() {
    resetFlyerUpload();
}

function resetFlyerUpload() {
    currentFlyerFile = null;
    currentFlyerData = null;
    document.getElementById('flyerInput').value = '';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('flyerPreview').style.display = 'none';
    document.getElementById('flyerPreviewImg').src = '';
}

// ==================== FORM SUBMISSION ====================

document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const publishBtn = document.getElementById('publishBtn');
        publishBtn.disabled = true;
        publishBtn.querySelector('.btn-text').style.display = 'none';
        publishBtn.querySelector('.btn-loading').style.display = 'flex';
        
        showLoading(true);
        
        const formData = {
            id: editingEventId || `evt_${Date.now()}`,
            title: document.getElementById('eventTitle').value,
            type: document.getElementById('eventType').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            location: document.getElementById('eventLocation').value,
            description: document.getElementById('eventDescription').value,
            speaker: document.getElementById('eventSpeaker').value,
            registrationLink: document.getElementById('eventRegistration').value,
            featured: document.getElementById('featuredEvent').checked,
            flyer: ''
        };
        
        // Handle flyer
        let flyerDataToSend = null;
        if (currentFlyerData) {
            const flyerFileName = `${formData.type}-${formData.date.replace(/-/g, '')}-${Date.now()}.jpg`;
            formData.flyer = `images/flyers/${flyerFileName}`;
            flyerDataToSend = currentFlyerData;
        } else if (editingEventId) {
            const existingEvent = currentEvents.find(e => e.id === editingEventId);
            formData.flyer = existingEvent.flyer;
        } else {
            showToast('Please upload a flyer for the event.', 'error');
            throw new Error('No flyer uploaded');
        }
        
        // Call Netlify function
        const action = editingEventId ? 'update' : 'add';
        await callNetlifyFunction(action, formData, editingEventId, flyerDataToSend);
        
        showToast(editingEventId ? 'Event updated successfully!' : 'Event published successfully!', 'success');
        
        setTimeout(() => {
            showDashboard();
            loadEvents();
        }, 1500);
        
    } catch (error) {
        console.error('Error saving event:', error);
        showToast('Failed to save event: ' + error.message, 'error');
    } finally {
        showLoading(false);
        const publishBtn = document.getElementById('publishBtn');
        publishBtn.disabled = false;
        publishBtn.querySelector('.btn-text').style.display = 'inline';
        publishBtn.querySelector('.btn-loading').style.display = 'none';
    }
});

// ==================== PREVIEW ====================

function previewEvent() {
    const title = document.getElementById('eventTitle').value;
    const type = document.getElementById('eventType').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const location = document.getElementById('eventLocation').value;
    const description = document.getElementById('eventDescription').value;
    const speaker = document.getElementById('eventSpeaker').value;
    
    if (!title || !type || !date || !time || !location) {
        showToast('Please fill in all required fields before previewing.', 'error');
        return;
    }
    
    const flyerSrc = currentFlyerData || (editingEventId ? 
        currentEvents.find(e => e.id === editingEventId).flyer : '');
    
    const previewHTML = `
        <div class="preview-event">
            ${flyerSrc ? `<img src="${flyerSrc}" alt="${title}" class="preview-flyer">` : ''}
            <h3>${title}</h3>
            <span class="event-type-badge badge-${type}">${getEventTypeLabel(type)}</span>
            <div class="preview-meta">
                <p>📅 ${formatDate(date)}</p>
                <p>🕐 ${time}</p>
                <p>📍 ${location}</p>
                ${speaker ? `<p>👤 ${speaker}</p>` : ''}
            </div>
            <p style="margin-top: 1rem;">${description}</p>
        </div>
    `;
    
    document.getElementById('previewContent').innerHTML = previewHTML;
    document.getElementById('previewModal').style.display = 'flex';
}

function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
}

// ==================== UI HELPERS ====================

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function showDashboard() {
    showView('dashboardView');
}

function refreshEvents() {
    loadEvents();
    showToast('Events refreshed!', 'success');
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✓' : '✕'}</div>
        <div>${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== UTILITIES ====================

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
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

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupFlyerUpload();
});

document.getElementById('previewModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'previewModal') {
        closePreview();
    }
});
