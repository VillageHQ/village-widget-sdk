# 📦 Deploying the Village Widget

A comprehensive guide to develop, configure, and deploy the **Village Widget**. Includes usage examples, event integration, and NPM deployment.

---

## ▶️ Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

The widget will be served at:

```
http://localhost:3000/village-widget-dev.js
```

---

### 🔗 Embedding Locally

Use the following snippet to include the widget in a host page during development:

```html
<script src="http://localhost:3000/village-widget-dev.js"></script>
<script>
  Village.init('YOUR_PUBLIC_KEY');
</script>
```

Alternatively, initialize with **custom CTAs**:

```js
Village.init('YOUR_PUBLIC_KEY', {
  paths_cta: [
    {
      label: "Save to CRM",
      callback: connectionSwal,
      style: {
        backgroundColor: "#007bff",
        color: "#fff",
        fontWeight: "bold",
        borderRadius: "8px",
      },
    },
    {
      label: "Alert now time",
      callback: () =>
        Swal.fire({
          toast: true,
          icon: 'warning',
          title: 'CTA clicked! ' + new Date().toLocaleString(),
          position: 'bottom-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          customClass: {
            popup: 'swal-z-top'
          }
        }),
      style: {
        backgroundColor: "#ffc107",
        color: "#000",
        fontStyle: "italic",
        border: "2px dashed #000",
      },
    },
  ],
});
```

---

## 🧪 Listening to Events (from JavaScript)

### ✅ In the main page:

```js
Village.on("village.path.cta.clicked", ({ action, data }) => {
  console.log("CTA clicked:", action, data);

  // Call global callback, if defined
  const cb = window[data.callbackName];
  if (typeof cb === "function") {
    cb(data);
  }
});
```

### 🧪 Emit an event (from widget or host page)

```js
Village.emit("village.path.cta.clicked", {
  action: "Send Intro",
  data: {
    introducer: { name: "John Doe", email: "john@example.com" },
    timestamp: new Date().toISOString(),
    callbackName: "sendIntroCallback"
  }
});
```

---

## 🪟 Listening from Parent Window (iframe support)

If the widget is embedded in an iframe:

```js
window.addEventListener("message", (event) => {
  if (event.data?.source !== "VillageSDK") return;

  const { type, payload } = event.data;

  if (type === "village.path.cta.clicked") {
    console.log("CTA triggered from iframe:", payload);
  }
});
```

---

## 🚀 Deploying to NPM

To release a new version of the widget:

### 1. Run the deploy script

```bash
npm run deploy
```

This will:

- Validate the `.env.production` file
- Auto-increment patch version (e.g. `1.2.3 → 1.2.4`)
- Build for production
- Publish to NPM

> Make sure you're logged in and have publish permissions.

### ✅ Sample output

```bash
✅ .env.production file exists
✅ Version updated from 1.2.3 to 1.2.4
✅ Build completed
✅ Successfully published version 1.2.4
```

---

## 📁 Output Paths

| Mode            | Path                                 |
|------------------|--------------------------------------|
| Development      | `/public/village-widget-dev.js`      |
| Production Build | `/dist/index.js`                     |

---

## 🎯 Event System (via `village-sdk-events`)

The Village Widget provides a type-safe, centralized event system for interaction across the widget, host page, and iframes.

### ✅ Available Events

| Event Name                   | Description                           |
|-----------------------------|---------------------------------------|
| `village.widget.ready`      | Widget finished rendering              |
| `village.path.cta.clicked`  | CTA button was clicked                 |
| `village.paths.cta.updated`| CTA list was dynamically updated       |

---

### 📥 Listening with TypeScript

```ts
import { VillageEvents } from "village-sdk-events";

Village.on(VillageEvents.pathCtaClicked, (payload) => {
  console.log("CTA clicked:", payload);
});
```

### 📤 Emitting with TypeScript

```ts
Village.emit(VillageEvents.pathCtaClicked, {
  source: "dynamic-cta",
  index: 0,
  cta: { label: "Save to CRM" },
  context: {
    from: "PathsConnection",
    path: {
      start_person: { full_name: "Abdallah Absi", id: "..." },
      end_person: { full_name: "Abdallah Absi", id: "..." },
      connector_person: { full_name: "James Kawas", id: "..." },
      type: "second_degree",
      paid_intro: null,
    },
    partnerDomain: "village.do",
  },
});
```

---

## 📌 Useful Commands

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run watch     # Auto-build on changes
npm run deploy    # Deploy to NPM
```
