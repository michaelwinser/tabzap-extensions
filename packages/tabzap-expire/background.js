importScripts('shared/config.js', 'shared/utils.js', 'config.js');

const CHECK_ALARM = 'checkExpiredTabs';
const CHECK_INTERVAL_MINUTES = 1;

let globalConfig;
// Map of tabId -> last active timestamp
let tabLastActive = new Map();

// Initialize: load config and set up alarm
function initialize() {
    loadConfig();

    // Set up periodic check
    chrome.alarms.create(CHECK_ALARM, { periodInMinutes: CHECK_INTERVAL_MINUTES });

    // Initialize all existing tabs with current timestamp
    chrome.tabs.query({}, function(tabs) {
        const now = Date.now();
        tabs.forEach(tab => {
            tabLastActive.set(tab.id, now);
        });
        console.log("Initialized %d tabs", tabs.length);
    });
}

function loadConfig() {
    configLoad(function(loadedConfig) {
        loadedConfig.expirePatterns = loadedConfig.expirePatterns.map(s => new RegExp(s));
        globalConfig = loadedConfig;
        updateBadge();
    });
}

// Update badge to show enabled/disabled status
function updateBadge() {
    if (!globalConfig) return;

    if (globalConfig.enabled) {
        chrome.action.setBadgeText({ text: "" });
    } else {
        chrome.action.setBadgeText({ text: "OFF" });
        chrome.action.setBadgeBackgroundColor({ color: "#888888" });
    }
}

// Check if a URL is eligible for expiry (matches allowlist)
function isExpirableUrl(url) {
    if (!url) return false;
    return globalConfig.expirePatterns.some(re => re.test(url));
}

// Check if a tab should be expired
function shouldExpireTab(tab) {
    if (!globalConfig.enabled) return false;
    if (globalConfig.ignorePinned && tab.pinned) return false;
    if (globalConfig.ignoreActive && tab.active) return false;
    if (globalConfig.ignoreAudible && tab.audible) return false;
    if (!isExpirableUrl(tab.url)) return false;

    const lastActive = tabLastActive.get(tab.id);
    if (!lastActive) return false;

    const expiryMs = globalConfig.expiryMinutes * 60 * 1000;
    const elapsed = Date.now() - lastActive;

    return elapsed >= expiryMs;
}

// Check all tabs and close expired ones
function checkExpiredTabs() {
    if (!globalConfig || !globalConfig.enabled) return;

    chrome.tabs.query({}, function(tabs) {
        const expiredTabs = tabs.filter(shouldExpireTab);

        if (expiredTabs.length > 0) {
            const tabIds = expiredTabs.map(t => t.id);
            console.log("Expiring %d tabs: %s", tabIds.length, tabIds.join(", "));
            chrome.tabs.remove(tabIds);

            // Clean up tracking
            tabIds.forEach(id => tabLastActive.delete(id));
        }
    });
}

// Track tab activation - reset timer when tab becomes active
function onTabActivated(activeInfo) {
    tabLastActive.set(activeInfo.tabId, Date.now());
}

// Track tab updates - reset timer on navigation
function onTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.url || changeInfo.status === 'complete') {
        tabLastActive.set(tabId, Date.now());
    }
}

// Track new tabs
function onTabCreated(tab) {
    tabLastActive.set(tab.id, Date.now());
}

// Clean up closed tabs
function onTabRemoved(tabId) {
    tabLastActive.delete(tabId);
}

// Toggle enabled state on icon click
function onClicked(tab) {
    if (!globalConfig) return;

    globalConfig.enabled = !globalConfig.enabled;
    configSave({ enabled: globalConfig.enabled });
    updateBadge();

    console.log("TabZap Expire %s", globalConfig.enabled ? "enabled" : "disabled");
}

// Handle alarm
function onAlarm(alarm) {
    if (alarm.name === CHECK_ALARM) {
        checkExpiredTabs();
    }
}

// Listen for config changes
chrome.storage.onChanged.addListener(loadConfig);

// Set up event listeners
chrome.tabs.onActivated.addListener(onTabActivated);
chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.tabs.onCreated.addListener(onTabCreated);
chrome.tabs.onRemoved.addListener(onTabRemoved);
chrome.action.onClicked.addListener(onClicked);
chrome.alarms.onAlarm.addListener(onAlarm);

// Initialize on load
initialize();
