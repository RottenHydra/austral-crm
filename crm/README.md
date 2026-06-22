# Austral Timber — Outreach CRM

A single source of truth for Gulf outreach across **email + WhatsApp**, so both daily bots
coordinate (no double-channel hits, cross-channel dedupe, response tracking) and you get a
live dashboard. Next.js (App Router) + Vercel Postgres. Seeded with 505 contacts.

## What it gives you
- **Dashboard** (`/`): stats + a filterable/searchable table of all 505 leads, with inline
  Response status and Next-step notes you can edit.
- **API the bots call** so the spreadsheet/manual sync is no longer needed:
  - `GET /api/next?channel=email&limit=10` → next companies to email (have email, not yet emailed).
  - `GET /api/next?channel=whatsapp&limit=15` → WhatsApp-FIRST list (mobile, **no email**, not yet messaged).
  - `GET /api/next?channel=whatsapp&mode=followup` → WhatsApp follow-ups (already emailed, no reply after 2+ days).
  - `POST /api/event` `{company, channel:'email'|'whatsapp', type:'sent'|'reply', detail}` → records a send/reply and advances state.
  - `POST /api/response` `{company, response?, next_step?}` → dashboard edits.
  - `POST /api/seed?token=SEED_TOKEN` → one-time load of the 505 contacts.

The channel rule is enforced in `/api/next`: **WhatsApp-first only for companies with no email**;
emailed companies are reserved for WhatsApp follow-up. Because every "sent" is written back via
`/api/event`, the two bots can never message the same company on the wrong channel.

## Deploy (about 10 minutes)
1. Put this folder in a GitHub repo (or use `vercel` CLI).
2. On vercel.com → **New Project** → import the repo.
3. In the project: **Storage → Create Database → Postgres** (Neon). Vercel injects `POSTGRES_URL` automatically.
4. **Settings → Environment Variables**: add `SEED_TOKEN` = any long random string.
5. **Deploy.**
6. Seed the data once:
   ```bash
   curl -X POST "https://YOUR-APP.vercel.app/api/seed?token=YOUR_SEED_TOKEN"
   ```
7. Open the app URL — the dashboard now shows all 505 leads.

## Local dev
```bash
npm install
# create .env with POSTGRES_URL=... and SEED_TOKEN=...
npm run dev
```

## Point the daily bots at the CRM (optional, recommended)
Once deployed, update the two scheduled tasks so each run:
1. `GET https://YOUR-APP.vercel.app/api/next?...` to fetch that day's batch,
2. sends the messages,
3. `POST https://YOUR-APP.vercel.app/api/event` for each one sent.

This replaces the static embedded lists and keeps everything in sync automatically.
Note: the scheduled-task runner is sandboxed, so confirm it can reach your Vercel URL; if
outbound calls are blocked there, keep the bots on their current lists and use the dashboard
as the live record (sync from Gmail Sent / WhatsApp as needed).

## Files
- `app/page.js` — dashboard (server component)
- `components/ContactsTable.js` — interactive table (client)
- `app/api/*` — seed / next / event / response / contacts
- `db/seed.json` — the 505 contacts
