**Village Widget SDK v0.0.47**

***

# 📦 Village Widget

A type‑safe, embeddable JavaScript widget for Village integrations, including a built‑in events SDK.

---

## Table of Contents

1. [Installation](#installation)  
2. [Usage](#usage)  
   - [Initializing the Widget](#initializing-the-widget)  
   - [Custom CTAs](#custom-ctas)  
   - [Listening to Events](#listening-to-events)  
3. [Development](#development)  
4. [Deployment](#deployment)  
5. [Available Events](#available-events)

---

## Installation

```bash
npm install @villagehq/village-widget
```

## Usage

### Initializing the Widget

```html
<script src="https://unpkg.com/@villagehq/village-widget/dist/index.js"></script>
<script>
  Village.init('YOUR_PUBLIC_KEY');
</script>
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

```js
// In your host page or iframe
Village.on(VillageEvents.pathCtaClicked, ({ index, cta, context }) => {
  console.log('CTA clicked:', cta.label, context);
});
```

---

## Development

```bash
npm install
npm run dev             # Watch mode
npm run lint            # ESLint
npm run format          # Prettier
npm run test            # Vitest
npm run check:bundle    # Build + JS syntax check
```

---

## Deployment

```bash
npm run build   # Production bundle
npm run deploy  # Bump version, build & publish
```

**Output:**

- Dev bundle: `public/village-widget-dev.js`  
- Prod bundle: `dist/index.js`

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
