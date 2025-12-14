// TabZap Switch configuration
// Uses shared config manager from shared/config.js

var defaultConfig = {
    // Scope: 'current' for current window only, 'all' for all windows
    scope: 'current',
    // Time in ms before cycle resets (user stops cycling)
    cycleTimeoutMs: 1500
};

// Create config manager instance
var configManager = createConfigManager(defaultConfig);

// Compatibility shims for existing code
function configGetEmpty() {
    return { scope: 'current', cycleTimeoutMs: 1500 };
}

function configGetDefaults() {
    return configManager.getDefaults();
}

function configRestoreDefault() {
    configManager.restoreDefault();
}

function configLoad(fn) {
    configManager.load(fn);
}

function configSave(source) {
    configManager.save(source);
}
