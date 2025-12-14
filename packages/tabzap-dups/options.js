
function restoreDefaultConfig() {
    console.log("restoreDefaultConfig")
    configRestoreDefault();
    load();
}

function isNotBlankString(s) {
    return s && !(/^\s*$/.test(s))
}

function save() {
    var config = configGetEmpty();
    config.scope = document.getElementById("scope").value;
    config.ignorePatterns = document.getElementById("ignorepatterns").value.split("\n").filter(isNotBlankString);
    config.urlPatterns = document.getElementById("urlpatterns").value.split("\n").filter(isNotBlankString);
    configSave(config)
    window.close();
}

function load() {
    configLoad(function(config) {
        document.getElementById("scope").value = config.scope || "window";
        document.getElementById("ignorepatterns").value = config.ignorePatterns.filter(isNotBlankString).join("\n");
        document.getElementById("urlpatterns").value = config.urlPatterns.filter(isNotBlankString).join("\n");
    })
}
function setup() {
    console.log("setup")
    document.getElementById("restore_defaults").addEventListener("click", restoreDefaultConfig);
    document.getElementById("save").addEventListener("click", save);
    document.getElementById("load").addEventListener("click", load);
    load();
}

document.addEventListener('DOMContentLoaded', setup);