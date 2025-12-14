// TabZap Expire configuration
// Uses shared config manager from shared/config.js

var defaultConfig = {
    // Default expiry time in minutes
    expiryMinutes: 60,
    // Don't expire pinned tabs
    ignorePinned: true,
    // Don't expire the active tab
    ignoreActive: true,
    // Don't expire tabs playing audio
    ignoreAudible: true,
    // URL patterns that ARE eligible for expiry (allowlist)
    expirePatterns: [
        // Social media
        "^https://(www\\.)?(twitter|x)\\.com/",
        "^https://(www\\.)?facebook\\.com/",
        "^https://(www\\.)?instagram\\.com/",
        "^https://(www\\.)?linkedin\\.com/feed",
        "^https://(www\\.)?linkedin\\.com/posts/",
        "^https://([^.]+\\.)?reddit\\.com/",
        "^https://(www\\.)?threads\\.net/",
        "^https://(www\\.)?tiktok\\.com/",
        // Shopping
        "^https://(www\\.)?amazon\\.",
        "^https://(www\\.)?ebay\\.",
        "^https://(www\\.)?etsy\\.com/",
        "^https://(www\\.)?walmart\\.com/",
        "^https://(www\\.)?target\\.com/",
        "^https://(www\\.)?bestbuy\\.com/",
        "^https://(www\\.)?newegg\\.com/",
        // Entertainment
        "^https://(www\\.)?youtube\\.com/watch",
        "^https://(www\\.)?netflix\\.com/",
        "^https://(www\\.)?hulu\\.com/",
        "^https://(www\\.)?twitch\\.tv/"
    ],
    // Whether expiry is enabled
    enabled: true
};

// Create config manager instance
var configManager = createConfigManager(defaultConfig);

// Compatibility shims for existing code
function configGetEmpty() {
    return {
        expiryMinutes: 60,
        ignorePinned: true,
        ignoreActive: true,
        ignoreAudible: true,
        expirePatterns: [],
        enabled: true
    };
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
