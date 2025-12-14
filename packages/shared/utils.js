// Shared utility functions for TabZap extensions

// Filter blank strings from an array (useful for textarea parsing)
function isNotBlankString(s) {
    return typeof s === 'string' && s.trim().length > 0;
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Extract domain parts from URL
// Returns { primary: "google.com", full: "docs.google.com" }
function getDomainParts(url) {
    try {
        const hostname = new URL(url).hostname;
        const parts = hostname.split('.');
        const primary = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
        return { primary: primary, full: hostname };
    } catch (e) {
        return { primary: '', full: '' };
    }
}

// Badge helper functions
function setBadgeText(text) {
    chrome.action.setBadgeText({ text: text });
}

function setBadgeBackgroundColor(color) {
    chrome.action.setBadgeBackgroundColor({ color: color });
}

// Clear badge
function clearBadge() {
    chrome.action.setBadgeText({ text: '' });
}
