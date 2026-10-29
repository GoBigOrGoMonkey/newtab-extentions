# Extension Vault

Next.js starter for a ZIP-based Chrome extension library with upload, listing, download, and replacement/update flows.

## Deploy to Vercel

1. Push this project to GitHub and import it into Vercel.
2. In Vercel project settings, make sure **Framework Preset** is **Next.js**.
3. In **Build and Deployment**, leave **Build Command** as `npm run build` (or the default) and **Output Directory** set to the framework default / override disabled. Do not set it to `public`.
4. Create and connect a Vercel Blob store and an Upstash Redis database from the Vercel Marketplace.
5. Redeploy after connecting storage.

## Local development

Requires Node.js 20.9+. Run `npm install`, configure `.env.local` from `.env.example`, then `npm run dev`.

## API

- `GET /api/extensions` — list catalog
- `POST /api/extensions/upload` — multipart form with `file`
- `GET /api/extensions/:id` — metadata
- `PUT /api/extensions/:id` — multipart form with replacement `file`
- `GET /api/extensions/:id/download` — redirect to ZIP download

The upload validates ZIP structure and a root `manifest.json`; it is not a malware scanner.

## Before public launch

This starter does not yet include publisher accounts, ownership checks, moderation, rate limiting, or malware scanning. Do not launch open public uploads until these protections are added. Only upload extensions you have permission to distribute.
