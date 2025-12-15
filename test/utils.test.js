// Tests for shared utility functions
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const { createChromeMock } = require('./chrome-mock.js');

// Helper to load a script file into a context with our mocks
function loadScript(filePath, context) {
    const code = fs.readFileSync(filePath, 'utf-8');
    vm.runInContext(code, context);
}

// Create a context with browser/chrome mocks
function createTestContext() {
    const chrome = createChromeMock();
    const context = vm.createContext({
        chrome,
        console,
        structuredClone: global.structuredClone,
        URL: global.URL,
        document: {
            createElement: function(tag) {
                let textContent = '';
                return {
                    get textContent() { return textContent; },
                    set textContent(val) { textContent = val; },
                    get innerHTML() {
                        return textContent
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');
                    }
                };
            }
        }
    });
    return { context, chrome };
}

describe('shared/utils.js', () => {
    let context, chrome;

    beforeEach(() => {
        const ctx = createTestContext();
        context = ctx.context;
        chrome = ctx.chrome;
        loadScript(path.join(__dirname, '../packages/shared/utils.js'), context);
    });

    describe('isNotBlankString', () => {
        it('returns true for non-empty strings', () => {
            const result = vm.runInContext('isNotBlankString("hello")', context);
            assert.strictEqual(result, true);
        });

        it('returns false for empty strings', () => {
            const result = vm.runInContext('isNotBlankString("")', context);
            assert.strictEqual(result, false);
        });

        it('returns false for whitespace-only strings', () => {
            const result = vm.runInContext('isNotBlankString("   ")', context);
            assert.strictEqual(result, false);
        });

        it('returns false for non-strings', () => {
            const result = vm.runInContext('isNotBlankString(123)', context);
            assert.strictEqual(result, false);
        });
    });

    describe('escapeHtml', () => {
        it('escapes HTML special characters', () => {
            const result = vm.runInContext('escapeHtml("<script>alert(1)</script>")', context);
            assert.strictEqual(result, '&lt;script&gt;alert(1)&lt;/script&gt;');
        });

        it('escapes quotes', () => {
            const result = vm.runInContext('escapeHtml(\'He said "hello"\')', context);
            assert.strictEqual(result, 'He said &quot;hello&quot;');
        });
    });

    describe('getDomainParts', () => {
        it('extracts domain parts from URL', () => {
            const result = vm.runInContext('getDomainParts("https://docs.google.com/document")', context);
            assert.strictEqual(result.primary, 'google.com');
            assert.strictEqual(result.full, 'docs.google.com');
        });

        it('handles simple domains', () => {
            const result = vm.runInContext('getDomainParts("https://example.com/path")', context);
            assert.strictEqual(result.primary, 'example.com');
            assert.strictEqual(result.full, 'example.com');
        });

        it('returns empty strings for invalid URLs', () => {
            const result = vm.runInContext('getDomainParts("not-a-url")', context);
            assert.strictEqual(result.primary, '');
            assert.strictEqual(result.full, '');
        });
    });

    describe('badge functions', () => {
        it('setBadgeText updates the badge', () => {
            vm.runInContext('setBadgeText("5")', context);
            assert.strictEqual(chrome.action._getBadge().text, '5');
        });

        it('clearBadge clears the badge', () => {
            vm.runInContext('setBadgeText("5")', context);
            vm.runInContext('clearBadge()', context);
            assert.strictEqual(chrome.action._getBadge().text, '');
        });
    });
});
