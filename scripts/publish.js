#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Extension IDs from Chrome Web Store (set these after first manual upload)
const EXTENSION_IDS = {
    'tabzap-dups': process.env.TABZAP_DUPS_ID || '',
    'tabzap-switch': process.env.TABZAP_SWITCH_ID || '',
    'tabzap-expire': process.env.TABZAP_EXPIRE_ID || '',
    'tabzap-select': process.env.TABZAP_SELECT_ID || ''
};

// Chrome Web Store API credentials (from environment)
const CLIENT_ID = process.env.CHROME_CLIENT_ID;
const CLIENT_SECRET = process.env.CHROME_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.CHROME_REFRESH_TOKEN;

function checkCredentials() {
    const missing = [];
    if (!CLIENT_ID) missing.push('CHROME_CLIENT_ID');
    if (!CLIENT_SECRET) missing.push('CHROME_CLIENT_SECRET');
    if (!REFRESH_TOKEN) missing.push('CHROME_REFRESH_TOKEN');

    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing.join(', '));
        console.error('\nTo set up Chrome Web Store API credentials:');
        console.error('1. Go to https://console.cloud.google.com/apis/credentials');
        console.error('2. Create an OAuth 2.0 Client ID (Desktop app type)');
        console.error('3. Enable the Chrome Web Store API');
        console.error('4. Use chrome-webstore-upload-cli to get a refresh token:');
        console.error('   npx chrome-webstore-upload-cli init');
        console.error('\nThen set the environment variables and retry.');
        process.exit(1);
    }
}

function checkCli() {
    try {
        execSync('npx chrome-webstore-upload-cli --version', { stdio: 'pipe' });
    } catch (e) {
        console.error('chrome-webstore-upload-cli not found. Installing...');
        execSync('npm install -D chrome-webstore-upload-cli', { stdio: 'inherit' });
    }
}

function getExtensionVersion(extName) {
    const manifestPath = path.join(DIST, extName, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Manifest not found: ${manifestPath}. Run 'npm run build' first.`);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    return manifest.version;
}

function publish(extName, options = {}) {
    const zipPath = path.join(DIST, `${extName}.zip`);
    const extId = EXTENSION_IDS[extName];

    if (!fs.existsSync(zipPath)) {
        console.error(`Zip not found: ${zipPath}. Run 'npm run build' first.`);
        return false;
    }

    if (!extId) {
        console.error(`No extension ID configured for ${extName}.`);
        console.error('Set the TABZAP_*_ID environment variable after first manual upload.');
        return false;
    }

    const version = getExtensionVersion(extName);
    console.log(`Publishing ${extName} v${version}...`);

    const args = [
        'chrome-webstore-upload-cli',
        'upload',
        '--source', zipPath,
        '--extension-id', extId,
        '--client-id', CLIENT_ID,
        '--client-secret', CLIENT_SECRET,
        '--refresh-token', REFRESH_TOKEN
    ];

    if (options.publish) {
        args.push('--auto-publish');
    }

    const result = spawnSync('npx', args, { stdio: 'inherit' });

    if (result.status !== 0) {
        console.error(`Failed to publish ${extName}`);
        return false;
    }

    console.log(`Successfully uploaded ${extName} v${version}`);
    return true;
}

function main() {
    const args = process.argv.slice(2);
    const doPublish = args.includes('--publish');
    const extFilter = args.find(a => !a.startsWith('--'));

    checkCredentials();
    checkCli();

    // Ensure build exists
    if (!fs.existsSync(DIST)) {
        console.error('dist/ not found. Run "npm run build" first.');
        process.exit(1);
    }

    const extensions = extFilter
        ? [extFilter]
        : Object.keys(EXTENSION_IDS);

    let success = true;
    for (const ext of extensions) {
        if (!EXTENSION_IDS.hasOwnProperty(ext)) {
            console.error(`Unknown extension: ${ext}`);
            success = false;
            continue;
        }
        if (!publish(ext, { publish: doPublish })) {
            success = false;
        }
    }

    process.exit(success ? 0 : 1);
}

main();
