let allTabs = [];
let filteredTabs = [];
let selectedTabIds = new Set();
let currentWindowId = null;
let allWindows = [];
let currentFilter = '';
let bookmarkFilter = 'all'; // 'all', 'bookmarked', 'not-bookmarked'
let bookmarkedUrls = new Set();
let isFullPage = false;

document.addEventListener('DOMContentLoaded', initialize);

// Check if we're running in a full tab (not popup)
function checkIfFullPage() {
    // If opened as a tab, the URL will have a query param or we can check window size
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fullpage') === '1') {
        isFullPage = true;
        document.body.classList.add('full-page');
    }
}

function openInNewTab() {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?fullpage=1') });
    window.close();
}

async function initialize() {
    // Check if running in full page mode
    checkIfFullPage();

    // Get current window
    const currentWindow = await chrome.windows.getCurrent();
    currentWindowId = currentWindow.id;

    // Get all windows and tabs
    allWindows = await chrome.windows.getAll({ populate: true });

    // Load bookmarked URLs
    await loadBookmarkedUrls();

    // Build tab list
    renderTabs();

    // Set up event listeners
    document.getElementById('popOut').addEventListener('click', openInNewTab);
    document.getElementById('filterInput').addEventListener('input', onFilterChange);
    document.getElementById('bookmarkFilter').addEventListener('change', onBookmarkFilterChange);
    document.getElementById('selectAll').addEventListener('click', selectAll);
    document.getElementById('selectNone').addEventListener('click', selectNone);
    document.getElementById('invertSelection').addEventListener('click', invertSelection);
    document.getElementById('closeTabs').addEventListener('click', closeTabs);
    document.getElementById('moveToNewWindow').addEventListener('click', moveToNewWindow);
    document.getElementById('moveToEnd').addEventListener('click', moveToEnd);
    document.getElementById('bookmarkTabs').addEventListener('click', bookmarkTabs);
    document.getElementById('moveToWindow').addEventListener('click', showWindowPicker);
}

async function loadBookmarkedUrls() {
    bookmarkedUrls.clear();
    const bookmarkTree = await chrome.bookmarks.getTree();

    function extractUrls(nodes) {
        for (const node of nodes) {
            if (node.url) {
                bookmarkedUrls.add(node.url);
            }
            if (node.children) {
                extractUrls(node.children);
            }
        }
    }

    extractUrls(bookmarkTree);
}

function onBookmarkFilterChange(e) {
    bookmarkFilter = e.target.value;
    renderTabs();
}

function onFilterChange(e) {
    currentFilter = e.target.value.toLowerCase().trim();
    renderTabs();
}

function tabMatchesFilter(tab) {
    // Check bookmark filter
    const isBookmarked = bookmarkedUrls.has(tab.url);
    if (bookmarkFilter === 'bookmarked' && !isBookmarked) return false;
    if (bookmarkFilter === 'not-bookmarked' && isBookmarked) return false;

    // Check text filter
    if (!currentFilter) return true;
    const title = (tab.title || '').toLowerCase();
    const url = (tab.url || '').toLowerCase();
    return title.includes(currentFilter) || url.includes(currentFilter);
}

// Extract domain parts for sorting (returns { primary: "google.com", full: "x.google.com" })
function getDomainParts(url) {
    try {
        const hostname = new URL(url).hostname;
        const parts = hostname.split('.');
        // Get primary domain (last two parts, or whole thing if less)
        const primary = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
        return { primary, full: hostname };
    } catch {
        return { primary: '', full: '' };
    }
}

// Sort tabs by primary domain, then subdomain
function sortTabsByDomain(tabs) {
    return [...tabs].sort((a, b) => {
        const domainA = getDomainParts(a.url);
        const domainB = getDomainParts(b.url);

        // First compare primary domains
        const primaryCompare = domainA.primary.localeCompare(domainB.primary);
        if (primaryCompare !== 0) return primaryCompare;

        // Then compare full hostnames
        return domainA.full.localeCompare(domainB.full);
    });
}

function renderTabs() {
    const tabList = document.getElementById('tabList');
    tabList.innerHTML = '';
    allTabs = [];
    filteredTabs = [];

    // Sort windows: current window first
    const sortedWindows = [...allWindows].sort((a, b) => {
        if (a.id === currentWindowId) return -1;
        if (b.id === currentWindowId) return 1;
        return 0;
    });

    for (const window of sortedWindows) {
        // Filter out pinned tabs and apply text filter
        const windowTabs = window.tabs.filter(tab => !tab.pinned && tabMatchesFilter(tab));

        // Collect all non-pinned tabs for operations
        for (const tab of window.tabs) {
            if (!tab.pinned) {
                allTabs.push(tab);
            }
        }

        // Skip window separator if no matching tabs
        if (windowTabs.length === 0) continue;

        // Sort tabs by domain
        const sortedTabs = sortTabsByDomain(windowTabs);

        // Add window separator if multiple windows
        if (allWindows.length > 1) {
            const separator = document.createElement('div');
            separator.className = 'window-separator';
            separator.textContent = window.id === currentWindowId ? 'Current Window' : `Window ${window.id}`;
            tabList.appendChild(separator);
        }

        for (const tab of sortedTabs) {
            filteredTabs.push(tab);
            const tabEl = createTabElement(tab);
            tabList.appendChild(tabEl);
        }
    }

    // Show no results message if filter active but no matches
    if (currentFilter && filteredTabs.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No tabs match your filter';
        tabList.appendChild(noResults);
    }

    updateSelectionCount();
}

function createTabElement(tab) {
    const div = document.createElement('div');
    div.className = 'tab-item' + (tab.active ? ' active' : '');
    if (selectedTabIds.has(tab.id)) {
        div.classList.add('selected');
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedTabIds.has(tab.id);
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleTab(tab.id, checkbox.checked);
        div.classList.toggle('selected', checkbox.checked);
    });

    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect fill="%23ddd" width="16" height="16" rx="2"/></svg>';
    favicon.onerror = () => {
        favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect fill="%23ddd" width="16" height="16" rx="2"/></svg>';
    };

    const info = document.createElement('div');
    info.className = 'tab-info';

    const title = document.createElement('div');
    title.className = 'tab-title';
    title.textContent = tab.title || 'Untitled';

    const url = document.createElement('div');
    url.className = 'tab-url';
    try {
        url.textContent = new URL(tab.url).hostname;
    } catch {
        url.textContent = tab.url;
    }

    info.appendChild(title);
    info.appendChild(url);

    div.appendChild(checkbox);
    div.appendChild(favicon);
    div.appendChild(info);

    // Add bookmark indicator
    if (bookmarkedUrls.has(tab.url)) {
        const bookmark = document.createElement('span');
        bookmark.className = 'bookmark-indicator';
        bookmark.textContent = '★';
        bookmark.title = 'Bookmarked';
        div.appendChild(bookmark);
    }

    // Click on row toggles selection
    div.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            toggleTab(tab.id, checkbox.checked);
            div.classList.toggle('selected', checkbox.checked);
        }
    });

    return div;
}

function toggleTab(tabId, selected) {
    if (selected) {
        selectedTabIds.add(tabId);
    } else {
        selectedTabIds.delete(tabId);
    }
    updateSelectionCount();
}

function updateSelectionCount() {
    document.getElementById('selectedCount').textContent = selectedTabIds.size;

    const hasSelection = selectedTabIds.size > 0;
    document.getElementById('closeTabs').disabled = !hasSelection;
    document.getElementById('moveToNewWindow').disabled = !hasSelection;
    document.getElementById('moveToEnd').disabled = !hasSelection;
    document.getElementById('bookmarkTabs').disabled = !hasSelection;
    document.getElementById('moveToWindow').disabled = !hasSelection || allWindows.length < 2;
}

function selectAll() {
    // Select all visible (filtered) tabs
    for (const tab of filteredTabs) {
        selectedTabIds.add(tab.id);
    }
    renderTabs();
}

function selectNone() {
    // Deselect all visible (filtered) tabs
    for (const tab of filteredTabs) {
        selectedTabIds.delete(tab.id);
    }
    renderTabs();
}

function invertSelection() {
    // Invert selection among visible (filtered) tabs
    for (const tab of filteredTabs) {
        if (selectedTabIds.has(tab.id)) {
            selectedTabIds.delete(tab.id);
        } else {
            selectedTabIds.add(tab.id);
        }
    }
    renderTabs();
}

async function closeTabs() {
    const tabIds = Array.from(selectedTabIds);
    await chrome.tabs.remove(tabIds);
    selectedTabIds.clear();
    window.close();
}

async function moveToNewWindow() {
    const tabIds = Array.from(selectedTabIds);
    // Create new window with first tab
    const newWindow = await chrome.windows.create({ tabId: tabIds[0] });
    // Move remaining tabs to new window
    if (tabIds.length > 1) {
        await chrome.tabs.move(tabIds.slice(1), { windowId: newWindow.id, index: -1 });
    }
    window.close();
}

async function moveToEnd() {
    const tabIds = Array.from(selectedTabIds);
    // Group tabs by window
    const tabsByWindow = new Map();
    for (const tab of allTabs) {
        if (selectedTabIds.has(tab.id)) {
            if (!tabsByWindow.has(tab.windowId)) {
                tabsByWindow.set(tab.windowId, []);
            }
            tabsByWindow.get(tab.windowId).push(tab.id);
        }
    }
    // Move each group to end of their window
    for (const [windowId, ids] of tabsByWindow) {
        await chrome.tabs.move(ids, { index: -1 });
    }
    window.close();
}

async function bookmarkTabs() {
    // Create a folder for the bookmarks
    const folder = await chrome.bookmarks.create({
        title: 'Saved Tabs ' + new Date().toLocaleString()
    });

    // Bookmark each selected tab
    for (const tab of allTabs) {
        if (selectedTabIds.has(tab.id)) {
            await chrome.bookmarks.create({
                parentId: folder.id,
                title: tab.title,
                url: tab.url
            });
        }
    }

    window.close();
}

async function showWindowPicker() {
    // Get other windows
    const otherWindows = allWindows.filter(w => w.id !== currentWindowId);
    if (otherWindows.length === 0) return;

    // Simple approach: move to next window
    // For more complex UI, you'd show a dropdown/modal
    if (otherWindows.length === 1) {
        await moveToWindow(otherWindows[0].id);
    } else {
        // Create a simple selection
        const windowId = await promptForWindow(otherWindows);
        if (windowId) {
            await moveToWindow(windowId);
        }
    }
}

async function promptForWindow(windows) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:100;';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:white;border-radius:8px;padding:16px;min-width:200px;';

        const title = document.createElement('div');
        title.style.cssText = 'font-weight:600;margin-bottom:12px;';
        title.textContent = 'Select Window';

        modal.appendChild(title);

        for (const win of windows) {
            const btn = document.createElement('button');
            btn.style.cssText = 'display:block;width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;text-align:left;';
            btn.textContent = `Window ${win.id} (${win.tabs.length} tabs)`;
            btn.addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(win.id);
            });
            modal.appendChild(btn);
        }

        const cancelBtn = document.createElement('button');
        cancelBtn.style.cssText = 'display:block;width:100%;padding:8px;border:none;background:#eee;border-radius:4px;cursor:pointer;';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });
        modal.appendChild(cancelBtn);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
}

async function moveToWindow(windowId) {
    const tabIds = Array.from(selectedTabIds);
    await chrome.tabs.move(tabIds, { windowId: windowId, index: -1 });
    window.close();
}
