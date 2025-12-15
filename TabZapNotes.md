# TabZap Extension Suite - Architecture Notes

## Overview

This document analyzes whether the four TabZap Chrome extensions should be combined into a single extension or kept separate.

## Extension Summary

| Extension | Purpose | Complexity |
|-----------|---------|------------|
| **tabzap** | Auto-removes duplicate tabs (same URL detection with smart patterns) | Low |
| **TabZapSwitch** | Alt-Tab style tab switcher with MRU ordering and visual overlay | High |
| **TabZapExpire** | Auto-closes inactive tabs after configurable timeout | Low |
| **TabZapSelect** | Multi-select tabs for batch operations (close, move, bookmark) | Medium |

## Decision: Keep Separate

**Recommendation**: Maintain as four separate extensions.

### Rationale

#### 1. Technical Independence

- Each extension operates completely independently with zero shared runtime state
- They don't conflict or need to coordinate
- TabZapSwitch requires `<all_urls>` host permission for overlay injection; the others don't need this invasive permission
- Combining would mean all users get the highest permission set even if they only want one feature

#### 2. Complexity & Maintenance

- TabZapSwitch alone is ~36KB of complex async code with caching and content script injection
- A combined extension would have a ~55KB+ background script with interleaved state machines
- Bugs in one feature could affect others
- Testing becomes exponentially harder with feature combinations

#### 3. User Experience

- Separate extensions = users can cherry-pick exactly what they want
- Each has its own dedicated icon action:
  - tabzap: cancels pending duplicate removal queue
  - TabZapExpire: toggles expiry on/off
  - TabZapSelect: opens multi-select popup
- A combined extension would need a multi-action popup or complex icon behavior

#### 4. Chrome Web Store Advantages

- **Discoverability**: Users searching for "duplicate tab remover" find tabzap; users searching for "tab switcher" find TabZapSwitch
- **Reviews**: Independent ratings per feature
- **Updates**: Can update one without touching others
- **Competitive positioning**: Each competes in its own niche

#### 5. Sync Goal

The primary goal of publishing to Chrome Web Store is easy sync across computers and browser profiles. This works equally well with 4 extensions as with 1—Chrome syncs all installed extensions automatically.

## Chrome Web Store Policy

The relevant policy is the **"Single Purpose" requirement**:

> "An extension must have a single purpose that is narrow and easy-to-understand."

Google interprets this flexibly for tab management extensions. The store has many successful multi-feature tab managers (OneTab, Tab Manager Plus, The Great Suspender, etc.) that combine duplicate detection, tab grouping, session management, and more.

A combined "TabZap" with selectively-enabled features would likely pass review, as "tab management" is an accepted single purpose category. However, this doesn't outweigh the benefits of keeping them separate.

## When Combining Would Make Sense

A combined extension would be better if:

- Monetization was planned and a single product was needed for marketing
- The features had runtime interactions (they don't)
- Reducing the number of extension icons was important
- A large user base requested consolidation

## Recommendations for Brand Unity

To maintain a cohesive "TabZap family" feel without combining:

1. **Keep them separate** for publication
2. **Add cross-links** in each extension's options page: "Other TabZap extensions: [links]"
3. **Use consistent naming**: TabZap (Duplicates), TabZap Switch, TabZap Expire, TabZap Select
4. **Unified icon style**: Same base icon with variant colors/badges

## Technical Details

### Permissions by Extension

| Permission | tabzap | Switch | Expire | Select |
|------------|--------|--------|--------|--------|
| `tabs` | Yes | Yes | Yes | Yes |
| `storage` | Yes | Yes | Yes | No |
| `alarms` | Yes | No | Yes | No |
| `webNavigation` | Yes | No | No | No |
| `scripting` | No | Yes | No | No |
| `activeTab` | No | Yes | No | No |
| `<all_urls>` | No | Yes | No | No |
| `bookmarks` | No | No | No | Yes |
| `notifications` | Yes | No | No | No |

### Code Size

| Extension | Background | Other | Total |
|-----------|------------|-------|-------|
| tabzap | ~5KB | ~4KB (config, options) | ~9KB |
| TabZapSwitch | ~18KB | ~21KB (overlay, config, options) | ~39KB |
| TabZapExpire | ~4KB | ~4KB (config, options) | ~8KB |
| TabZapSelect | N/A | ~22KB (popup) | ~22KB |

### Shared Patterns

All extensions share:

- Configuration pattern: `config.js` with `configLoad()`, `configSave()`, `configGetDefaults()`
- Similar options UI: Card-based dark theme layout
- Manifest V3: Service workers (except TabZapSelect which has no background)

No actual code is shared between extensions—each is independently implemented.

## Summary

| Factor | Separate | Combined |
|--------|----------|----------|
| Chrome policy compliance | Easy | Acceptable |
| Permission minimization | Better | Over-permissioned |
| Maintenance complexity | Lower | Higher |
| User choice | Better | All-or-nothing |
| Discoverability | Better | Single search point |
| Sync goal achieved | Yes | Yes |

**Conclusion**: Keep the extensions separate. They serve the sync goal equally well while being easier to maintain and more respectful of users who only want a subset of features.

---

## Shared Library Opportunities

After detailed code review, the following patterns are duplicated across extensions and could be extracted into a shared library.

### 1. Configuration Module (`config.js`)

All four extensions implement nearly identical configuration patterns:

```javascript
// Current pattern (repeated in each extension)
function configGetEmpty() { ... }
function configGetDefaults() { return JSON.parse(JSON.stringify(defaultConfig)); }
function configRestoreDefault() { configSave(defaultConfig); }
function configLoad(fn) { chrome.storage.sync.get(defaultConfig, fn); }
function configSave(source) { chrome.storage.sync.set(source); }
```

**Shared library opportunity**: Create a generic config module that takes `defaultConfig` as a parameter.

```javascript
// shared/config.js
export function createConfigManager(defaultConfig) {
    return {
        getEmpty: () => structuredClone(defaultConfig),
        getDefaults: () => structuredClone(defaultConfig),
        restoreDefault: () => chrome.storage.sync.set(defaultConfig),
        load: (fn) => chrome.storage.sync.get(defaultConfig, fn),
        save: (source) => chrome.storage.sync.set(source)
    };
}
```

### 2. Options Page UI Framework

All options pages share:
- Identical CSS (~150 lines): cards, buttons, toggles, form styling
- Same font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto...`
- Same color scheme: `#f5f5f7` background, `#0071e3` primary, `#ff3b30` danger
- Same layout pattern: header with icon, cards with settings rows, button group footer

**Shared library opportunity**: Extract to `shared/options.css` and `shared/options-base.js`.

### 3. Utility Functions

Duplicated utilities:

| Function | Found In | Purpose |
|----------|----------|---------|
| `isNotBlankString(s)` | tabzap, TabZapExpire | Filter blank lines from textarea |
| `escapeHtml(str)` | TabZapSwitch overlay | XSS prevention |
| `getDomainParts(url)` | TabZapSelect | Parse hostname from URL |
| Badge management | tabzap, TabZapExpire | `setBadgeText`, `setBadgeBackgroundColor` |

### 4. Tab Display Components

Both **TabZapSwitch** (overlay) and **TabZapSelect** (popup) render tab lists with:
- Favicon display with fallback
- Title truncation with ellipsis
- URL/hostname display
- Selection highlighting
- Keyboard navigation

**Shared library opportunity**: Create a `TabListRenderer` class.

```javascript
// shared/tab-renderer.js
export class TabListRenderer {
    constructor(options) {
        this.containerEl = options.container;
        this.onSelect = options.onSelect;
        this.showCheckboxes = options.showCheckboxes ?? false;
    }

    render(tabs, selectedIndex) { ... }
    renderFavicon(tab) { ... }
    formatUrl(url) { ... }
}
```

---

## Feature Cross-Pollination Opportunities

### Features TabZapSelect Should Borrow from TabZapSwitch

| Feature | Currently In | Value for TabZapSelect |
|---------|--------------|------------------------|
| **Thumbnail previews** | TabZapSwitch | Show preview on hover/selection in popup |
| **Favicon caching** | TabZapSwitch | Currently re-fetches each popup open |
| **MRU sorting option** | TabZapSwitch | Alternative to domain sorting |
| **Keyboard shortcuts** | TabZapSwitch | Number keys to quick-select tabs |

### Features TabZapSwitch Should Borrow from TabZapSelect

| Feature | Currently In | Value for TabZapSwitch |
|---------|--------------|------------------------|
| **Text search/filter** | TabZapSelect | Already has this! (type to search) |
| **Bookmark indicator** | TabZapSelect | Show ★ for bookmarked tabs in overlay |
| **Multi-select** | TabZapSelect | Batch operations from switcher overlay |
| **Domain grouping** | TabZapSelect | Group tabs by domain in MRU list |

### Potential New Shared Features

1. **"Close Duplicates" action in TabZapSelect**
   - Uses tabzap's URL normalization logic
   - One-click removal of all duplicates from selected set

2. **"Expire Selected" in TabZapSelect**
   - Mark selected tabs for immediate expiry (uses TabZapExpire)
   - Or set custom expiry time for selected tabs

3. **MRU integration in TabZapExpire**
   - Use TabZapSwitch's MRU tracking to expire "least recently used" first
   - More intelligent than pure time-based expiry

4. **Unified URL pattern library**
   - tabzap and TabZapExpire both have URL pattern lists
   - Could share common patterns (social media, shopping, etc.)

---

## Monorepo Recommendation

**Recommendation: Yes, use a monorepo**

Even while keeping extensions separate for end users, a monorepo provides significant benefits.

### Proposed Structure

```
tabzap-extensions/
├── packages/
│   ├── shared/
│   │   ├── config.js           # Configuration management
│   │   ├── options.css         # Shared options page styles
│   │   ├── options-base.js     # Shared options page logic
│   │   ├── tab-renderer.js     # Tab list rendering
│   │   ├── url-patterns.js     # Shared URL patterns
│   │   └── utils.js            # Utility functions
│   │
│   ├── tabzap/
│   │   ├── manifest.json
│   │   ├── background.js
│   │   ├── options.html
│   │   └── options.js
│   │
│   ├── tabzap-switch/
│   │   ├── manifest.json
│   │   ├── background.js
│   │   ├── overlay.js
│   │   ├── options.html
│   │   └── options.js
│   │
│   ├── tabzap-expire/
│   │   └── ...
│   │
│   └── tabzap-select/
│       └── ...
│
├── scripts/
│   ├── build.js               # Build script to bundle each extension
│   ├── package.js             # Create .zip files for Chrome Web Store
│   └── dev.js                 # Development server with hot reload
│
├── package.json
└── README.md
```

### Benefits of Monorepo

| Benefit | Description |
|---------|-------------|
| **Single source of truth** | Shared code lives in one place |
| **Atomic changes** | Update shared code and all extensions together |
| **Consistent tooling** | One ESLint config, one build system |
| **Easier testing** | Shared test utilities, integration tests across extensions |
| **Simpler CI/CD** | One pipeline builds and publishes all extensions |
| **Version coordination** | Ensure compatible versions are released together |

### Build System

A simple build script can:
1. Copy shared code into each extension directory
2. Bundle/minify if desired (optional for small extensions)
3. Generate `.zip` files for Chrome Web Store upload

```javascript
// scripts/build.js (sketch)
const extensions = ['tabzap', 'tabzap-switch', 'tabzap-expire', 'tabzap-select'];

for (const ext of extensions) {
    // Copy shared modules
    copyDir('packages/shared', `dist/${ext}/shared`);
    // Copy extension-specific files
    copyDir(`packages/${ext}`, `dist/${ext}`);
    // Create zip for Chrome Web Store
    createZip(`dist/${ext}`, `dist/${ext}.zip`);
}
```

### Import Strategy for Shared Code

Chrome extensions can't use ES modules in service workers (Manifest V3 limitation), so shared code must be included via `importScripts()`:

```javascript
// background.js
importScripts('shared/config.js', 'shared/utils.js');
```

Or bundled at build time into a single file.

### Migration Path

1. **Phase 1**: Create monorepo structure, move extensions as-is
2. **Phase 2**: Extract `shared/config.js` and `shared/options.css`
3. **Phase 3**: Extract `shared/tab-renderer.js` for Switch and Select
4. **Phase 4**: Add cross-pollinated features using shared code

---

## Summary of Recommendations

| Recommendation | Rationale |
|----------------|-----------|
| **Keep extensions separate** | Better UX, permissions, discoverability |
| **Use a monorepo** | Easier maintenance, shared code, coordinated releases |
| **Extract shared config module** | Identical code in all 4 extensions |
| **Extract shared options CSS** | ~150 lines duplicated 4 times |
| **Create shared tab renderer** | Switch overlay and Select popup overlap significantly |
| **Cross-pollinate features** | Thumbnail previews, bookmark indicators, MRU sorting |
| **Unify URL pattern library** | tabzap and Expire both have pattern lists |
