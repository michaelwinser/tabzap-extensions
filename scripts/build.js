#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PACKAGES = path.join(ROOT, 'packages');
const DIST = path.join(ROOT, 'dist');

const extensions = ['tabzap-dups', 'tabzap-switch', 'tabzap-expire', 'tabzap-select'];

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
}

async function createZip(sourceDir, zipPath) {
    const zipDir = path.dirname(zipPath);
    if (!fs.existsSync(zipDir)) {
        fs.mkdirSync(zipDir, { recursive: true });
    }

    // Remove existing zip if present
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }

    // Use system zip command
    const zipName = path.basename(zipPath);
    const sourceName = path.basename(sourceDir);
    const parentDir = path.dirname(sourceDir);

    try {
        execSync(`cd "${parentDir}" && zip -r "${zipPath}" "${sourceName}"`, { stdio: 'pipe' });
        console.log(`  Created ${zipName}`);
    } catch (e) {
        console.error(`  Failed to create ${zipName}: ${e.message}`);
    }
}

async function build() {
    console.log('Building TabZap extensions...\n');

    for (const ext of extensions) {
        console.log(`Building ${ext}...`);

        const distDir = path.join(DIST, ext);
        const extDir = path.join(PACKAGES, ext);
        const sharedDir = path.join(PACKAGES, 'shared');

        // Clean and create dist directory
        if (fs.existsSync(distDir)) {
            fs.rmSync(distDir, { recursive: true });
        }
        fs.mkdirSync(distDir, { recursive: true });

        // Copy shared modules
        const sharedDest = path.join(distDir, 'shared');
        copyDir(sharedDir, sharedDest);
        console.log('  Copied shared modules');

        // Copy extension-specific files
        const entries = fs.readdirSync(extDir);
        for (const entry of entries) {
            const srcPath = path.join(extDir, entry);
            const destPath = path.join(distDir, entry);

            if (fs.statSync(srcPath).isDirectory()) {
                copyDir(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
        console.log('  Copied extension files');

        // Create zip for Chrome Web Store
        await createZip(distDir, path.join(DIST, `${ext}.zip`));
    }

    console.log('\nBuild complete!');
}

// Run if called directly
if (require.main === module) {
    build().catch(console.error);
}

module.exports = { build };
