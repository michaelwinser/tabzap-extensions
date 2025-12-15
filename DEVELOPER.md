# Developer Guide

## Prerequisites

- Node.js 18.0.0 or higher (required for built-in test runner)
- Git

## Project Structure

```
tabzap-extensions/
├── packages/
│   ├── shared/           # Shared utilities and styles
│   ├── tabzap-dups/      # Duplicate tab manager
│   ├── tabzap-switch/    # Tab switcher
│   ├── tabzap-expire/    # Tab expiration
│   └── tabzap-select/    # Tab selector
├── scripts/
│   ├── build.js          # Build script
│   └── publish.js        # Chrome Web Store publishing
├── test/
│   ├── chrome-mock.js    # Chrome API mock for testing
│   ├── config.test.js    # Config manager tests
│   └── utils.test.js     # Utility function tests
└── dist/                 # Build output (gitignored)
```

## Getting Started

```bash
# Clone the repository
git clone https://github.com/michaelwinser/tabzap-extensions.git
cd tabzap-extensions

# Install dependencies
npm install

# Run tests
npm test

# Build all extensions
npm run build
```

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build all extensions to `dist/` |
| `npm run clean` | Remove the `dist/` directory |
| `npm test` | Run all tests |
| `npm run publish:upload` | Upload to Chrome Web Store (draft) |
| `npm run publish:release` | Upload and publish to Chrome Web Store |

## Testing

Tests use Node.js built-in test runner with a custom Chrome API mock.

```bash
# Run all tests
npm test

# Run a specific test file
node --test test/utils.test.js
```

### Writing Tests

Tests load extension scripts into a VM context with mocked Chrome APIs:

```javascript
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const { createChromeMock } = require('./chrome-mock.js');

// Create context with mocks
const chrome = createChromeMock();
const context = vm.createContext({ chrome, console });

// Load and test scripts
vm.runInContext(code, context);
```

### Chrome Mock

The mock in `test/chrome-mock.js` provides:

- `chrome.storage.sync` - get, set, clear
- `chrome.action` - setBadgeText, setBadgeBackgroundColor
- `chrome.tabs` - query, remove, update

Inspection methods (`_getAll()`, `_getBadge()`, `_getTabs()`) are available for assertions.

## Building

```bash
npm run build
```

This creates for each extension:
- `dist/<extension>/` - Unpacked extension (for development)
- `dist/<extension>.zip` - Packaged extension (for Chrome Web Store)

### Loading Unpacked Extensions

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/<extension>/` folder

## Publishing to Chrome Web Store

### First-Time Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Chrome Web Store API

2. **Create OAuth Credentials**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID (Desktop app type)
   - Note the Client ID and Client Secret

3. **Get Refresh Token**
   ```bash
   npx chrome-webstore-upload-cli init
   ```
   Follow the prompts to authorize and get a refresh token.

4. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Fill in your credentials:
   ```
   CHROME_CLIENT_ID=your-client-id
   CHROME_CLIENT_SECRET=your-client-secret
   CHROME_REFRESH_TOKEN=your-refresh-token
   ```

5. **First Upload**
   - Manually upload each extension via the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Note each extension's ID from the dashboard
   - Add IDs to your `.env`:
   ```
   TABZAP_DUPS_ID=abc123...
   TABZAP_SWITCH_ID=def456...
   ```

### Publishing Updates

```bash
# Build first
npm run build

# Upload as draft (review before publishing)
npm run publish:upload

# Upload and auto-publish
npm run publish:release

# Publish a specific extension
npm run publish:upload -- tabzap-dups
```

## Code Style

- Vanilla JavaScript (no transpilation)
- Chrome Extension Manifest V3
- Shared code goes in `packages/shared/`
- Each extension is self-contained in its package directory
