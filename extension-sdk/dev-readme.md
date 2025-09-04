## Local Development & Testing

To run and test your own version of the extension using a local build of the SDK:

### 1. Build the SDK

Use the local development environment:

```bash
cd frontend-web/src/apps/extension-sdk
npm run build
```

### 2. Link the SDK in your extension repo

In your `frontend-chrome` (extension) repo, update your `package.json`:

#### Before:

```json
"@villagehq/extension-sdk": "^0.1.21",
```

#### After:

```json
"@villagehq/extension-sdk": "file:../frontend-web/src/apps/extension-sdk",
```

Then reinstall dependencies:

```bash
npm install
```

Now your extension will use the local SDK build.

### 📦 Example `.env.development` file

Paste the following content into `frontend-web/src/apps/extension-sdk/.env.development`:

```dotenv
VITE_VILLAGE_API_URL=http://localhost:8000/
VITE_VILLAGE_FRONTEND_URL=http://localhost:3000/
VITE_POSTHOG_KEY=phc_eM9Ie4T0FvMBXIi5Dg0A9z6L2cT5Y0jY0zsJTQkYB6v
```

### 📦 Example `.env.production` file

Paste the following content into `frontend-web/src/apps/extension-sdk/.env.production`:

```dotenv
VITE_VILLAGE_API_URL=https://api.village.do/
VITE_VILLAGE_FRONTEND_URL=https://village.do/
VITE_POSTHOG_KEY=phc_cWZiUS6cHGvUDyCMDRK8Cvoayv5m6x6YOT02RW91vOX
```

These environment variables are required to support analytics, auth redirects, and API endpoints in each environment.
