# TabZap Extensions

A monorepo containing the TabZap suite of Chrome extensions for tab management.

## Extensions

| Extension | Description |
|-----------|-------------|
| **TabZap** (tabzap) | Automatically closes duplicate tabs within the same window |
| **TabZap Switch** (tabzap-switch) | Alt-Tab style tab switcher with Most Recently Used ordering |
| **TabZap Expire** (tabzap-expire) | Automatically closes tabs that have been inactive for too long |
| **TabZap Select** (tabzap-select) | Multi-select tabs for batch operations (close, move, bookmark) |

## Project Structure

```
tabzap-extensions/
├── packages/
│   ├── shared/           # Shared modules used by all extensions
│   │   ├── config.js     # Configuration management
│   │   ├── options.css   # Shared options page styles
│   │   └── utils.js      # Utility functions
│   │
│   ├── tabzap/           # Duplicate tab closer
│   ├── tabzap-switch/    # MRU tab switcher
│   ├── tabzap-expire/    # Tab expiry
│   └── tabzap-select/    # Multi-select operations
│
├── scripts/
│   └── build.js          # Build script
│
├── dist/                 # Build output
│   ├── tabzap/
│   ├── tabzap-switch/
│   ├── tabzap-expire/
│   ├── tabzap-select/
│   └── *.zip             # Chrome Web Store packages
│
└── package.json
```

## Development

### Building

```bash
npm run build
```

This will:
1. Copy shared modules to each extension's dist folder
2. Copy extension-specific files
3. Create `.zip` files for Chrome Web Store submission

### Loading for Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select a folder from `dist/`

### Shared Modules

Extensions use shared code via `importScripts()` in service workers:

```javascript
// In background.js
importScripts('shared/config.js', 'shared/utils.js');

const config = createConfigManager(defaultConfig);
config.load((loadedConfig) => { ... });
```

For options pages, link the shared CSS:

```html
<link rel="stylesheet" href="shared/options.css">
```

## Clean Build

```bash
npm run clean
npm run build
```
