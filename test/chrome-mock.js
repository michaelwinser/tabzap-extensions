// Mock Chrome Extension APIs for testing

function createChromeMock() {
    const storage = {};
    const badges = { text: '', color: '' };
    const tabs = [];

    return {
        storage: {
            sync: {
                get: function(defaults, callback) {
                    const result = { ...defaults };
                    for (const key of Object.keys(defaults)) {
                        if (key in storage) {
                            result[key] = storage[key];
                        }
                    }
                    if (callback) callback(result);
                    return Promise.resolve(result);
                },
                set: function(items, callback) {
                    Object.assign(storage, items);
                    if (callback) callback();
                    return Promise.resolve();
                },
                clear: function(callback) {
                    for (const key of Object.keys(storage)) {
                        delete storage[key];
                    }
                    if (callback) callback();
                    return Promise.resolve();
                },
                // For test inspection
                _getAll: () => ({ ...storage })
            }
        },
        action: {
            setBadgeText: function(details) {
                badges.text = details.text || '';
                return Promise.resolve();
            },
            setBadgeBackgroundColor: function(details) {
                badges.color = details.color || '';
                return Promise.resolve();
            },
            // For test inspection
            _getBadge: () => ({ ...badges })
        },
        tabs: {
            query: function(queryInfo, callback) {
                const result = tabs.filter(tab => {
                    if (queryInfo.active !== undefined && tab.active !== queryInfo.active) return false;
                    if (queryInfo.currentWindow !== undefined && tab.currentWindow !== queryInfo.currentWindow) return false;
                    if (queryInfo.url && !tab.url.includes(queryInfo.url)) return false;
                    return true;
                });
                if (callback) callback(result);
                return Promise.resolve(result);
            },
            remove: function(tabIds, callback) {
                const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
                for (const id of ids) {
                    const index = tabs.findIndex(t => t.id === id);
                    if (index !== -1) tabs.splice(index, 1);
                }
                if (callback) callback();
                return Promise.resolve();
            },
            update: function(tabId, updateProperties, callback) {
                const tab = tabs.find(t => t.id === tabId);
                if (tab) Object.assign(tab, updateProperties);
                if (callback) callback(tab);
                return Promise.resolve(tab);
            },
            // For test setup
            _addTab: (tab) => tabs.push({ id: tabs.length + 1, ...tab }),
            _clearTabs: () => tabs.length = 0,
            _getTabs: () => [...tabs]
        },
        // Reset all mocks
        _reset: function() {
            for (const key of Object.keys(storage)) delete storage[key];
            badges.text = '';
            badges.color = '';
            tabs.length = 0;
        }
    };
}

module.exports = { createChromeMock };
