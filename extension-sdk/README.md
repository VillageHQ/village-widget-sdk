# Village Extension SDK

This SDK allows partners to integrate Village's relationship intelligence features into their own Chrome extensions.

## Installation

```bash
npm install @villagehq/extension-sdk
```

## Usage

The SDK provides two main functions:

1. `initServiceWorker` – Initializes the Village functionality in your extension's service worker
2. `initContentScript` – Initializes the Village functionality in your extension's content script

### Service Worker Integration

In your extension's service worker file:

```javascript
import Village from "@villagehq/extension-sdk";

// Initialize Village service worker
Village.initServiceWorker();

// You can add your own extension functionality here
```

### Content Script Integration

In your extension's content script file:

```javascript
import Village from "@villagehq/extension-sdk";

// Initialize Village content script
Village.initContentScript();

// You can add your own extension functionality here
```

## Required Permissions

Your extension's `manifest.json` must include the following permissions:

```json
{
  "permissions": [
    "cookies",
    "storage",
    "webRequest",
    "alarms",
    "webNavigation"
  ],
  "host_permissions": ["*://*.linkedin.com/*", "*://*.village.do/*"]
}
```

## Example Extension

Here's a complete example of how to set up a basic extension with Village integration:

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "My Extension with Village",
  "version": "1.0.0",
  "description": "My extension with Village integration",
  "permissions": ["cookies", "storage", "webRequest", "alarms"],
  "host_permissions": ["*://*.linkedin.com/*", "*://*.village.do/*"],
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"]
    }
  ]
}
```

### service-worker.js

```javascript
import Village from "@villagehq/extension-sdk";

// Initialize Village service worker
Village.initServiceWorker();
```

### content-script.js

```javascript
import Village from "@villagehq/extension-sdk";

// Initialize Village content script
Village.initContentScript();
```

## Support

For any questions or issues, please contact Village support at [support@village.do](mailto:support@village.do).

## Features

- LinkedIn integration
- Relationship intelligence
- Connection path discovery
- Village API integration

## Documentation

For full documentation, visit [docs.village.do](https://docs.village.do).

## License

**Proprietary.** This code is the exclusive property of Village. Use of this SDK is restricted to Village partners with valid contracts only.
