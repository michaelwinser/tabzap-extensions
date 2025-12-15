# Privacy Policy

**Effective Date:** December 14, 2024

This privacy policy applies to all TabZap browser extensions:
- TabZap Dups
- TabZap Switch
- TabZap Expire
- TabZap Select

## Data Collection

**TabZap extensions do not collect, store, or transmit any personal data or browsing information.**

## Data Storage

All extension settings and preferences are stored locally on your device using Chrome's built-in storage API (`chrome.storage.sync`). This data may sync across your Chrome browsers if you are signed into Chrome, but it is managed entirely by Google and is never accessed by us.

## Data Transmission

TabZap extensions do not transmit any data to external servers. All processing happens locally within your browser.

## Permissions

TabZap extensions request only the minimum permissions necessary to function:

| Permission | Purpose |
|------------|---------|
| tabs | Read tab URLs and titles to provide tab management features |
| storage | Save your preferences locally |
| alarms | Schedule background tasks (duplicate detection, tab expiration) |
| bookmarks | Create bookmarks from selected tabs (TabZap Select only) |
| webNavigation | Detect when pages finish loading (TabZap Dups only) |
| scripting | Display visual overlays (TabZap Switch only) |

## Third-Party Services

TabZap extensions do not use any third-party analytics, tracking, or advertising services.

## Changes to This Policy

If this privacy policy changes, the updated policy will be posted to the GitHub repository and the Chrome Web Store listing.

## Contact

For questions about this privacy policy, please open an issue at:
https://github.com/michaelwinser/tabzap-extensions/issues

## Summary

- No data collection
- No data transmission
- No tracking
- No analytics
- No ads
