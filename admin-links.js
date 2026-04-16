// IHYA NYC Admin - Links Manager
// Handles link management in the admin panel

let currentLinks = [];
let editingLinkId = null;

// ==================== SECTION NAVIGATION ====================

function showSection(section) {
    // Update tabs
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${section}`).classList.add('active');
    
    // Update sections
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');
    
    // Load data for the section
    if (section === 'links') {
        loadLinks();
    } else if (section === 'events') {
        loadEvents();
    }
}

// ==================== LOAD LINKS ====================

async function loadLinks() {
    try {
        showLoading(true);
        
        const response = await fetch('https://raw.githubusercontent.com/Tafvy/IHYA-NYC/main/data/links.json');
        
        if (response.ok) {
            const data = await response.json();
            currentLinks = data.links || [];
        } else {
            currentLinks = [];
        }
        
        displayLinks();
        updateLinkStats();
        
    } catch (error) {
        console.error('Error loading links:', error);
        showToast('Failed to load links. Using empty state.', 'error');
        currentLinks = [];
        displayLinks();
    } finally {
        showLoading(false);
    }
}

function displayLinks() {
    const container = document.getElementById('linksList');
    
    if (currentLinks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔗</div>
                <p>No links yet. Add your first link to get started!</p>
            </div>
        `;
        return;
    }
    
    // Sort by order
    const sortedLinks = [...currentLinks].sort((a, b) => (a.order || 999) - (b.order || 999));
    
    container.innerHTML = sortedLinks.map(link => `
        <div class="link-card ${!link.enabled ? 'link-disabled' : ''}">
            <div class="link-handle">⋮⋮</div>
            <div class="link-icon-display">${link.icon || '🔗'}</div>
            <div class="link-info">
                <h3>${link.title}</h3>
                ${link.subtitle ? `<p class="link-subtitle">${link.subtitle}</p>` : ''}
                <div class="link-meta">
                    <span>📊 ${link.clicks || 0} clicks</span>
                    <span>🔢 Order: ${link.order || 'N/A'}</span>
                    ${link.featured ? '<span class="badge-featured">⭐ Featured</span>' : ''}
                    ${!link.enabled ? '<span class="badge-disabled">❌ Disabled</span>' : ''}
                </div>
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-url" onclick="event.stopPropagation()">
                    ${link.url}
                </a>
            </div>
            <div class="link-actions">
                <button onclick="editLink('${link.id}')" class="btn-edit">✏️ Edit</button>
                <button onclick="deleteLink('${link.id}')" class="btn-delete">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function updateLinkStats() {
    const activeLinks = currentLinks.filter(l => l.enabled !== false);
    const featuredLinks = currentLinks.filter(l => l.featured);
    const totalClicks = currentLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
    
    document.getElementById('activeLinksCount').textContent = activeLinks.length;
    document.getElementById('featuredLinksCount').textContent = featuredLinks.length;
    document.getElementById('totalClicks').textContent = totalClicks;
}

// ==================== LINK FORM ====================

function showAddLink() {
    editingLinkId = null;
    document.getElementById('linkFormTitle').textContent = 'Add New Link';
    document.getElementById('linkForm').reset();
    document.getElementById('linkId').value = '';
    document.getElementById('linkEnabled').checked = true;
    document.getElementById('linkOrder').value = currentLinks.length + 1;
    
    showLinkView('linkFormView');
}

function editLink(linkId) {
    const link = currentLinks.find(l => l.id === linkId);
    if (!link) return;
    
    editingLinkId = linkId;
    document.getElementById('linkFormTitle').textContent = 'Edit Link';
    
    document.getElementById('linkId').value = link.id;
    document.getElementById('linkTitle').value = link.title;
    document.getElementById('linkSubtitle').value = link.subtitle || '';
    document.getElementById('linkUrl').value = link.url;
    document.getElementById('linkIcon').value = link.icon || '🔗';
    document.getElementById('linkOrder').value = link.order || 1;
    document.getElementById('linkFeatured').checked = link.featured || false;
    document.getElementById('linkEnabled').checked = link.enabled !== false;
    
    showLinkView('linkFormView');
}

async function deleteLink(linkId) {
    if (!confirm('Are you sure you want to delete this link? This cannot be undone.')) {
        return;
    }
    
    try {
        showLoading(true);
        
        await callNetlifyFunction('manage-links', {
            action: 'delete',
            linkId
        });
        
        showToast('Link deleted successfully!', 'success');
        
        setTimeout(() => {
            loadLinks();
        }, 1000);
        
    } catch (error) {
        console.error('Error deleting link:', error);
        showToast('Failed to delete link: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ==================== FORM SUBMISSION ====================

document.getElementById('linkForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const saveBtn = document.getElementById('saveLinkBtn');
        saveBtn.disabled = true;
        saveBtn.querySelector('.btn-text').style.display = 'none';
        saveBtn.querySelector('.btn-loading').style.display = 'flex';
        
        showLoading(true);
        
        const linkData = {
            id: editingLinkId || `link_${Date.now()}`,
            title: document.getElementById('linkTitle').value,
            subtitle: document.getElementById('linkSubtitle').value || null,
            url: document.getElementById('linkUrl').value,
            icon: document.getElementById('linkIcon').value || '🔗',
            order: parseInt(document.getElementById('linkOrder').value) || 1,
            featured: document.getElementById('linkFeatured').checked,
            enabled: document.getElementById('linkEnabled').checked,
            clicks: editingLinkId ? 
                (currentLinks.find(l => l.id === editingLinkId)?.clicks || 0) : 
                0
        };
        
        const action = editingLinkId ? 'update' : 'add';
        await callNetlifyFunction('manage-links', {
            action,
            linkData,
            linkId: editingLinkId
        });
        
        showToast(editingLinkId ? 'Link updated successfully!' : 'Link added successfully!', 'success');
        
        setTimeout(() => {
            showLinksDashboard();
            loadLinks();
        }, 1500);
        
    } catch (error) {
        console.error('Error saving link:', error);
        showToast('Failed to save link: ' + error.message, 'error');
    } finally {
        showLoading(false);
        const saveBtn = document.getElementById('saveLinkBtn');
        saveBtn.disabled = false;
        saveBtn.querySelector('.btn-text').style.display = 'inline';
        saveBtn.querySelector('.btn-loading').style.display = 'none';
    }
});

// ==================== VIEW HELPERS ====================

function showLinkView(viewId) {
    document.querySelectorAll('#section-links .view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function showLinksDashboard() {
    showLinkView('linksDashboardView');
}

function refreshLinks() {
    loadLinks();
    showToast('Links refreshed!', 'success');
}

// ==================== API CALL ====================

async function callNetlifyFunction(functionName, data) {
    const response = await fetch(`/.netlify/functions/${functionName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
}
