// Shared configuration management for TabZap extensions
// Usage: const config = createConfigManager(defaultConfig);

function createConfigManager(defaultConfig) {
    return {
        getEmpty: function() {
            return structuredClone(defaultConfig);
        },
        getDefaults: function() {
            return structuredClone(defaultConfig);
        },
        restoreDefault: function() {
            chrome.storage.sync.set(defaultConfig);
        },
        load: function(fn) {
            chrome.storage.sync.get(defaultConfig, function(loadedConfig) {
                console.log("config loaded %s", JSON.stringify(loadedConfig));
                fn(loadedConfig);
            });
        },
        save: function(source) {
            chrome.storage.sync.set(source);
        }
    };
}
