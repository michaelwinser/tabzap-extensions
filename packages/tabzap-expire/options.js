function restoreDefaultConfig() {
    console.log("restoreDefaultConfig");
    configRestoreDefault();
    load();
}

function isNotBlankString(s) {
    return s && !(/^\s*$/.test(s));
}

function save() {
    var config = {
        enabled: document.getElementById("enabled").checked,
        expiryMinutes: parseInt(document.getElementById("expiryMinutes").value, 10) || 60,
        ignorePinned: document.getElementById("ignorePinned").checked,
        ignoreActive: document.getElementById("ignoreActive").checked,
        ignoreAudible: document.getElementById("ignoreAudible").checked,
        expirePatterns: document.getElementById("expirePatterns").value.split("\n").filter(isNotBlankString)
    };
    configSave(config);
    window.close();
}

function load() {
    configLoad(function(config) {
        document.getElementById("enabled").checked = config.enabled;
        document.getElementById("expiryMinutes").value = config.expiryMinutes;
        document.getElementById("ignorePinned").checked = config.ignorePinned;
        document.getElementById("ignoreActive").checked = config.ignoreActive;
        document.getElementById("ignoreAudible").checked = config.ignoreAudible;
        document.getElementById("expirePatterns").value = config.expirePatterns.filter(isNotBlankString).join("\n");
    });
}

function setup() {
    console.log("setup");
    document.getElementById("restore_defaults").addEventListener("click", restoreDefaultConfig);
    document.getElementById("save").addEventListener("click", save);
    document.getElementById("load").addEventListener("click", load);
    load();
}

document.addEventListener('DOMContentLoaded', setup);
