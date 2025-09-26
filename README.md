# 📦 Village Widget

A type‑safe, embeddable JavaScript widget for Village integrations, including a built‑in events SDK.

---

## Table of Contents

1. [Installation](#installation)  
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
   - [Token-based Authentication](#token-based-authentication)
   - [User Reference Authentication](#user-reference-authentication)
   - [Browser Extension Support](#browser-extension-support)
4. [Usage](#usage)  
   - [Initializing the SDK](#initializing-the-sdk)  
   - [Custom CTAs](#custom-ctas)  
   - [Listening to Events](#listening-to-events)  
5. [Module Usage (ES6)](#module-usage-es6)
6. [Development](#development)  
7. [API Reference](#api-reference)
8. [Available Events](#available-events)

---

## Installation

### NPM/Yarn
```bash
npm install @villagehq/widget-sdk
# or
yarn add @villagehq/widget-sdk
```

### CDN (Script Tag)
```html
<script src="https://unpkg.com/@villagehq/widget-sdk/dist/village-widget.js"></script>
```

### ES6 Module
```javascript
import Village from '@villagehq/widget-sdk';
```

## Quick Start

```javascript
// Initialize the SDK
Village.init('YOUR_PARTNER_KEY');

// Authenticate with token
const authResult = await Village.authorize('your-auth-token', 'yourdomain.com');
if (authResult.ok) {
  console.log('Authenticated successfully!');
}
```

## Authentication

### Token-based Authentication

For applications with existing authentication systems:

```javascript
// Basic token authentication
const result = await Village.authorize(authToken, 'yourdomain.com');

// With automatic token refresh
const result = await Village.authorize(
  authToken, 
  'yourdomain.com',
  async () => {
    // Your token refresh logic
    const newToken = await refreshAuthToken();
    return newToken;
  }
);
```

### User Reference Authentication

For backwards compatibility with the identify system:

```javascript
// Identify user with reference ID
await Village.authorize('user-123', { 
  email: 'user@example.com',
  name: 'John Doe' 
});

// Or use the legacy identify method
await Village.identify('user-123', {
  email: 'user@example.com',
  name: 'John Doe'
});
```

### Browser Extension Support

The SDK is fully CSP-compliant for Chrome and Firefox extensions:

```javascript
// manifest.json (Chrome Extension Manifest V3)
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },
  "host_permissions": ["https://yourdomain.com/*"]
}

// In your extension popup or content script
import Village from '@villagehq/widget-sdk';

Village.init('YOUR_PARTNER_KEY');
const result = await Village.authorize(token, 'yourdomain.com');
```

## Usage

### Initializing the SDK

```javascript
// Basic initialization
Village.init('YOUR_PARTNER_KEY');

// With configuration
Village.init('YOUR_PARTNER_KEY', {
  paths_cta: [],  // Custom CTAs (see below)
  // other config options
});
```

### Custom CTAs

```js
// external callback function
function alertUser() {
  alert('This alert comes from an external callback!');
}

Village.init('YOUR_PUBLIC_KEY', {
  paths_cta: [
    {
      label: 'Save to CRM',
      // inline callback function
      callback() {
        // your save logic here
        alert('Record saved to CRM!');
      },
      // simple style example
      style: {
        backgroundColor: '#007bff',
        color: '#fff'
      }
    },
    {
      label: 'Alert me',
      callback: alertUser,
      style: {
        backgroundColor: '#dc3545',
        color: '#fff'
      }
    }
  ]
});
```

### Listening to Events

```javascript
// Listen for widget ready
Village.on('village.widget.ready', (data) => {
  console.log('Widget is ready!', data);
});

// Listen for CTA clicks
Village.on('village.path.cta.clicked', ({ index, cta, context }) => {
  console.log('CTA clicked:', cta.label, context);
});

// Listen for OAuth success
Village.on('village.oauth.success', ({ token }) => {
  console.log('OAuth successful, token received');
});

// Listen for paths CTA updates
Village.on('village.paths_cta.updated', (updatedCTAs) => {
  console.log('CTAs updated:', updatedCTAs);
});
```

---

## Module Usage (ES6)

For modern JavaScript applications and bundlers:

```javascript
// Import the module
import Village from '@villagehq/widget-sdk';

// Initialize
Village.init('YOUR_PARTNER_KEY');

// Use async/await for authentication
async function authenticate() {
  try {
    const result = await Village.authorize(token, 'yourdomain.com');
    if (result.ok) {
      console.log('Authentication successful!');
    } else {
      console.error('Authentication failed:', result.reason);
    }
  } catch (error) {
    console.error('Error during authentication:', error);
  }
}

// Dynamic CTA management
Village.updatePathsCTA([
  { label: 'Action 1', callback: () => console.log('Action 1') },
  { label: 'Action 2', callback: () => console.log('Action 2') }
]);

// Add single CTA on the fly
Village.addPathCTA({
  label: 'New Action',
  callback: (payload) => {
    console.log('New action clicked', payload);
  }
});
```

---

## Development

```bash
npm install
npm run dev             # Watch mode (builds to development folder)
npm run build           # Production build
npm run build:staging   # Staging build
npm run lint            # ESLint
npm run format          # Prettier
npm run test            # Vitest
npm run check:bundle    # Build + JS syntax check
```

---

## API Reference

### Core Methods

#### `Village.init(partnerKey, config?)`
Initialize the Village SDK with your partner key.

**Parameters:**
- `partnerKey` (string, required): Your Village partner key
- `config` (object, optional): Configuration options
  - `paths_cta`: Array of CTA objects

**Returns:** Village instance

---

#### `Village.authorize(token, domain, refreshCallback?)`
Authenticate a user with token or user reference.

**Parameters:**
- `token` (string): Auth token
- `domain` (string): Domain for token auth
- `refreshCallback` (function, optional): Async function to refresh token when expired

**Returns:** Promise<AuthResult>
```javascript
{
  ok: boolean,
  status: 'authorized' | 'unauthorized',
  domain?: string,
  reason?: string
}
```

---

#### `Village.identify(userReference, details?)`
Legacy method for user identification (backwards compatibility).

**Parameters:**
- `userReference` (string): Unique user identifier
- `details` (object, optional): User details (email, name, etc.)

**Returns:** Promise<void>

---

#### `Village.logout()`
Log out the current user and clear authentication.

---

#### `Village.on(event, callback)`
Subscribe to Village events.

**Parameters:**
- `event` (string): Event name
- `callback` (function): Event handler

---

#### `Village.emit(event, data)`
Emit custom events.

**Parameters:**
- `event` (string): Event name
- `data` (any): Event data

---

#### `Village.updatePathsCTA(ctaList)`
Replace the entire CTA list.

**Parameters:**
- `ctaList` (array): Array of CTA objects

---

#### `Village.addPathCTA(cta)`
Add a single CTA to the existing list.

**Parameters:**
- `cta` (object): CTA object with label and callback

---

## Available Events

| Event                       | Description                                    | Payload                      |
|-----------------------------|------------------------------------------------|------------------------------|
| `village.widget.ready`      | Widget has initialized                         | `void`                       |
| `village.path.cta.clicked`  | User clicked a configured CTA                  | `{ index, cta, context }`    |
| `village.paths_cta.updated` | CTA list was dynamically updated               | `PathCTA[]`                  |
| `village.user.synced`       | User graph sync completed                      | `{ userId, syncedAt }`       |
| `village.oauth.success`     | OAuth flow succeeded with token                | `{ token }`                  |
| `village.oauth.error`       | OAuth flow failed                              | `{ error }`                  |
| `village.widget.error`      | Internal widget error                          | `{ message, source, details }` |



