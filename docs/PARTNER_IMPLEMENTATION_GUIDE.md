# Village SDK Partner Implementation Guide

## Implementation Options

Village SDK now supports two implementation methods to solve CSP restrictions in browser extensions while maintaining backwards compatibility for websites.

## Option 1: Traditional Script Tag (Websites)

### Current Implementation (Unchanged)
```html
<script>
  (function(){var w=window;var d=document;var v=w.Village||{};d.head.appendChild(Object.assign(d.createElement("style"),{textContent:'[village-paths-availability="found"],[village-paths-availability="not-found"]{display:none}'}));v.q=v.q||[];v._call=function(method,args){v.q.push([method,args])};v.init=function(){v._call("init",arguments)};v.authorize=function(){v._call("authorize",arguments)};w.Village=v;var l=function(){var s=d.createElement("script");s.type="text/javascript";s.async=true;s.src="https://js.village.do";var x=d.getElementsByTagName("script")[0];x.parentNode.insertBefore(s,x)};if(w.Village.loaded)return;if(w.attachEvent){w.attachEvent("onload",l)}else{w.addEventListener("load",l,false)}w.Village.loaded=true})();
  Village.init('VILLAGE_PUBLIC_KEY');
  Village.authorize('GENERATED_TOKEN');
</script>
```

### When to Use
- ✅ Regular websites
- ✅ Web applications without CSP restrictions
- ✅ Existing integrations (no changes needed)

### Limitations
- ❌ Blocked by CSP `script-src` policies
- ❌ Can't be used in browser extensions
- ❌ Requires remote script loading

---

## Option 2: Import Module (Extensions & Modern Apps)

### New Implementation
```javascript
// Import the bundled Village SDK
import Village from '@villagehq/village-widget/dist/village-module.mjs';

// Initialize exactly like before
Village.init('VILLAGE_PUBLIC_KEY');
Village.authorize('GENERATED_TOKEN');
```

### When to Use
- ✅ Browser extensions (Chrome & Firefox)
- ✅ Applications with strict CSP
- ✅ Modern build systems (Webpack, Vite, etc.)
- ✅ Server-side rendering environments

### Benefits
- ✅ No CSP restrictions
- ✅ All code bundled locally
- ✅ Firefox AMO compatible
- ✅ Same API as script version

---

## Implementation Comparison

| Feature | Script Tag | Import Module |
|---------|------------|---------------|
| **Setup** | Add script to `<head>` | `import` statement |
| **Initialization** | `Village.init()` | `Village.init()` |
| **Authorization** | `Village.authorize()` | `Village.authorize()` |
| **HTML Attributes** | `village-data-url` ✅ | `village-data-url` ✅ |
| **Find Intro Button** | ✅ Works | ✅ Works |
| **CSP Compatibility** | ❌ Blocked | ✅ Works |
| **Extension Use** | ❌ Blocked | ✅ Works |
| **Bundle Size** | Remote load | ~87KB bundled |

## Detailed Implementation Steps

### For Browser Extensions

#### 1. Installation
```bash
npm install @villagehq/village-widget
```

#### 2. Import and Initialize
```javascript
// In your extension's content script or popup
import Village from '@villagehq/village-widget/dist/village-module.mjs';

// Initialize with your partner key
Village.init('your-partner-key');

// Authorize user (recommended for secure mode)
const result = await Village.authorize('user-token', 'your-domain.com', async () => {
  // Token refresh callback
  const newToken = await refreshUserToken();
  return newToken;
});

if (result.ok) {
  console.log('✅ User authorized successfully');
} else {
  console.log('❌ Authorization failed:', result.reason);
}
```

#### 3. HTML Integration (Identical to Script Version)
```html
<!-- Find intro button - works automatically -->
<button village-data-url="https://www.linkedin.com/company/google">
  <span village-paths-availability="found">
    <span village-paths-data="facepiles"></span>
    <span village-paths-data="count"></span> paths found
  </span>
  <span village-paths-availability="not-found">Find an intro</span>
  <span village-paths-availability="loading">Loading...</span>
</button>

<!-- Embedded paths widget -->
<div village-module="paths" village-data-url="https://www.linkedin.com/in/john-doe">
  <div village-paths-availability="found">
    <!-- Village will auto-populate this with paths -->
  </div>
  <div village-paths-availability="not-found">
    No paths found. <a href="#" village-module="sync">Grow my network →</a>
  </div>
  <div village-paths-availability="loading">Loading...</div>
</div>
```

#### 4. Event Handling
```javascript
// Listen for Village events
Village.on(Village.VillageEvents.pathCtaClicked, (data) => {
  console.log('Path CTA clicked:', data);
});

Village.on(Village.VillageEvents.widgetReady, (data) => {
  console.log('Village widget ready:', data);
});

Village.on(Village.VillageEvents.oauthSuccess, (data) => {
  console.log('OAuth success:', data);
});
```

#### 5. Custom CTAs
```javascript
// Add custom CTAs
Village.updatePathsCTA([
  {
    label: 'Save to CRM',
    callback: (payload) => {
      // Your CRM integration logic
      saveToCRM(payload);
    },
    style: {
      backgroundColor: '#007bff',
      color: '#fff'
    }
  },
  {
    label: 'Export Data',
    callback: (payload) => {
      // Your export logic
      exportData(payload);
    },
    style: {
      backgroundColor: '#28a745',
      color: '#fff'
    }
  }
]);
```

### For Modern Web Applications

#### React/Next.js Example
```javascript
// pages/_app.tsx
import { useEffect } from 'react';
import Village from '@villagehq/village-widget/dist/village-module.mjs';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize Village SDK
    Village.init(process.env.NEXT_PUBLIC_VILLAGE_PUBLIC_KEY);
    
    // Set up authorization
    if (userToken) {
      Village.authorize(userToken);
    }
  }, []);

  return <Component {...pageProps} />;
}
```

#### Vue.js Example
```javascript
// main.js
import { createApp } from 'vue';
import Village from '@villagehq/village-widget/dist/village-module.mjs';
import App from './App.vue';

const app = createApp(App);

// Initialize Village globally
Village.init('your-partner-key');

app.mount('#app');
```

## Migration Guide

### From Script Tag to Import

**Step 1: Remove Script Tag**
```html
<!-- REMOVE THIS -->
<script>
  (function(){...})();
  Village.init('VILLAGE_PUBLIC_KEY');
</script>
```

**Step 2: Add Import**
```javascript
// ADD THIS
import Village from '@villagehq/village-widget/dist/village-module.mjs';

Village.init('VILLAGE_PUBLIC_KEY');
```

**Step 3: Keep HTML Unchanged**
```html
<!-- THIS STAYS THE SAME -->
<button village-data-url="https://www.linkedin.com/company/google">
  <!-- Same HTML structure -->
</button>
```

## Extension Manifest Requirements

### Chrome Extension (Manifest V3)
```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://api.village.do/*"],
  "web_accessible_resources": [{
    "resources": ["village-sdk.mjs"],
    "matches": ["<all_urls>"]
  }],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

### Firefox Extension
```json
{
  "manifest_version": 2,
  "permissions": ["storage", "activeTab", "https://api.village.do/*"],
  "web_accessible_resources": ["village-sdk.mjs"],
  "content_security_policy": "script-src 'self'; object-src 'self';"
}
```

## API Reference

### Core Functions (Same for Both Approaches)

```javascript
// Initialization
Village.init(partnerKey: string, config?: VillageInitOptions): Village

// Authorization
Village.authorize(token: string, domain?: string, refreshCallback?: () => Promise<string>): Promise<AuthResult>

// User Management
Village.identify(userReference: string, details?: any): Promise<void>
Village.logout(): void

// Events
Village.on(event: string, callback: (data: any) => void): void
Village.emit(event: string, data: any): void
Village.broadcast(event: string, data: any): void

// CTAs
Village.updatePathsCTA(ctas: PathCTA[]): Village
Village.addPathCTA(cta: PathCTA): Village
Village.getPathsCTA(): PathCTA[]
Village.executeCallback(payload: any): void

// Storage (Extension-specific)
Village.sendStorageGetToken(): void
Village.sendStorageSetToken(token: string): void
Village.sendStorageDeleteToken(): void
```

### Available Events
```javascript
Village.VillageEvents = {
  widgetReady: 'village.widget.ready',
  pathCtaClicked: 'village.path.cta.clicked',
  pathsCtaUpdated: 'village.paths.cta.updated',
  oauthSuccess: 'village.oauth.success',
  userLoggedOut: 'village.user.logged.out'
}
```

## Best Practices

### 1. Error Handling
```javascript
try {
  const result = await Village.authorize(token, domain, refreshCallback);
  if (!result.ok) {
    console.error('Authorization failed:', result.reason);
    // Handle auth failure
  }
} catch (error) {
  console.error('Village SDK error:', error);
}
```

### 2. Token Management
```javascript
// Store tokens securely
const storeToken = (token) => {
  if (typeof chrome !== 'undefined') {
    chrome.storage.local.set({ villageToken: token });
  } else {
    localStorage.setItem('villageToken', token);
  }
};

// Refresh token callback
const refreshToken = async () => {
  const response = await fetch('/api/refresh-village-token');
  const data = await response.json();
  return data.token;
};
```

### 3. Extension Integration
```javascript
// Content script example
import Village from './village-sdk.mjs';

// Initialize when content script loads
Village.init('your-partner-key');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'OPEN_VILLAGE_PATHS') {
    // Village will automatically handle elements with village-data-url
    // or you can programmatically trigger paths
  }
});
```

## Support

### File Sizes
- **Script Version**: ~62KB (IIFE, minified)
- **Module Version**: ~87KB (ES Module, includes dependencies)

### Browser Support
- Chrome 88+ (MV3)
- Firefox 109+ (MV3)
- Safari 14+
- Edge 88+

### Dependencies Included
- axios (HTTP client)
- js-cookie (Cookie management)
- uuid (ID generation)
- @floating-ui/dom (Positioning)

All dependencies are bundled - no external CDN dependencies required.
