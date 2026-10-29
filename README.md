# Extension Vault

A Next.js starter for a ZIP-based Chrome extension library with upload, listing, download, and replacement/update flows.

## Before deploying

**Important:** this starter is not production-ready for an open public upload service. Uploading is currently unauthenticated, and public ZIP downloads are accessible to anyone. Before sharing it publicly, add publisher authentication, rate limiting, moderation/reporting, ownership checks on updates, malware scanning, and abuse controls. Only distribute extensions you have permission to share.

## Deploy to Vercel

1. Upload this project to a private or public GitHub repository.
2. Import the repository in Vercel as a Next.js project.
3. In Vercel Storage, create a **Blob** store and a **KV** store and connect them to this project. This provides `BLOB_READ_WRITE_TOKEN` and `KV_*` environment variables.
4. Deploy. Redeploy after adding or changing environment variables.
5. Open the deployed site and upload a `.zip` containing `manifest.json` at the ZIP root.

## Local development

- Node.js 20.9+
- `npm install`
- Connect a Vercel Blob and KV store (or set the variables in `.env.local`)
- `npm run dev`

## API

- `GET /api/extensions` — list the catalog
- `POST /api/extensions/upload` — multipart form with `file`
- `GET /api/extensions/:id` — extension metadata
- `PUT /api/extensions/:id` — multipart form with replacement `file`
- `GET /api/extensions/:id/download` — redirect to ZIP download

The API validates ZIP format and checks for a root `manifest.json`, but this is not a security scanner. Extension installation behavior is controlled by Chrome; downloading a ZIP does not automatically install it.

## Chrome extension integration

A companion Chrome extension can request `GET https://YOUR_DOMAIN/api/extensions` and display `extensions`. Download a ZIP using `/api/extensions/:id/download`. If the companion extension uses `fetch`, configure the correct host permissions in its own manifest and handle CORS if needed. Never execute downloaded extension code automatically.
