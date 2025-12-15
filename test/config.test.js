// Tests for shared config manager
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const { createChromeMock } = require('./chrome-mock.js');

function loadScript(filePath, context) {
    const code = fs.readFileSync(filePath, 'utf-8');
    vm.runInContext(code, context);
}

function createTestContext() {
    const chrome = createChromeMock();
    const context = vm.createContext({
        chrome,
        console,
        structuredClone: global.structuredClone
    });
    return { context, chrome };
}

describe('shared/config.js', () => {
    let context, chrome;

    beforeEach(() => {
        const ctx = createTestContext();
        context = ctx.context;
        chrome = ctx.chrome;
        loadScript(path.join(__dirname, '../packages/shared/config.js'), context);
    });

    describe('createConfigManager', () => {
        it('getDefaults returns a copy of default config', () => {
            vm.runInContext(`
                var defaults = { enabled: true, timeout: 30 };
                var config = createConfigManager(defaults);
                var result = config.getDefaults();
            `, context);

            const result = vm.runInContext('result', context);
            assert.deepStrictEqual(result, { enabled: true, timeout: 30 });
        });

        it('getEmpty returns a copy of default config', () => {
            vm.runInContext(`
                var defaults = { enabled: false };
                var config = createConfigManager(defaults);
                var result = config.getEmpty();
            `, context);

            const result = vm.runInContext('result', context);
            assert.deepStrictEqual(result, { enabled: false });
        });

        it('save persists config to chrome.storage.sync', () => {
            vm.runInContext(`
                var defaults = { enabled: true };
                var config = createConfigManager(defaults);
                config.save({ enabled: false, newKey: 'value' });
            `, context);

            const stored = chrome.storage.sync._getAll();
            assert.deepStrictEqual(stored, { enabled: false, newKey: 'value' });
        });

        it('load retrieves config from chrome.storage.sync', () => {
            // Pre-populate storage with a value different from default
            chrome.storage.sync.set({ enabled: false });

            vm.runInContext(`
                var defaults = { enabled: true };
                var config = createConfigManager(defaults);
                var loadedResult = null;
                config.load(function(cfg) {
                    loadedResult = cfg;
                });
            `, context);

            // Callback is synchronous in our mock
            const loadedResult = vm.runInContext('loadedResult', context);
            assert.strictEqual(loadedResult.enabled, false);
        });

        it('restoreDefault saves default config to storage', () => {
            // First save some custom config
            chrome.storage.sync.set({ enabled: false, extra: 'stuff' });

            vm.runInContext(`
                var defaults = { enabled: true };
                var config = createConfigManager(defaults);
                config.restoreDefault();
            `, context);

            const stored = chrome.storage.sync._getAll();
            assert.strictEqual(stored.enabled, true);
        });
    });
});
