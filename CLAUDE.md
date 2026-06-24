# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo (`ilchervonero/apps`) for the professional services site **ilchervo.com** and its suite of web apps. Everything lives under `chervo-web/`; the root `vercel.json` declares three Vercel projects (`ilframe`, `chervo-web`, `djcu-app`).

## Architecture

### `chervo-web/` — Main site (ilchervo.com)

The site is **fully static HTML generated at deploy time** from Notion. No framework, no build step beyond running `generate.js`.

- **`generate.js`** — Node script that queries five Notion databases via the REST API, renders all dynamic content (services, clients, hero words, contact info, apps grid) directly into `index.html`, and writes the file to disk. This is the build command Vercel runs.
- **`index.html`** — The generated artifact. It should not be hand-edited for content; edit `generate.js` or update Notion instead.
- **`clientes/index.html`** — Client login/register page using Supabase Auth (`sb_publishable_*` key is safe to commit; it is the anon publishable key).
- **`clientes/portal.html`** — Authenticated client view; reads the `clients` table in Supabase for `name` and `drive_url`, then shows a Google Drive link if one is assigned.
- **`notion-backup.json`** — A snapshot of Notion DB content used as a reference/migration aid, not read at runtime.

**Notion DB schema** (all queried in `generate.js`):
| DB env var | Properties used |
|---|---|
| `DB_SERVICIOS` | Nombre, Descripcion, Orden, Activo (checkbox) |
| `DB_CLIENTES` | Nombre, Titulo (role), Orden, Visible (checkbox) |
| `DB_HERO` | Clave / Valor (config map) |
| `DB_CONTACTO` | Clave / Valor (config map) |
| `DB_APLICACIONES` | Nombre, Descripcion, URL, Icono, Orden, Activo |

Config keys: `hero_palabras_rotativas` (comma-separated), `whatsapp`, `email`.

**Supabase:** `https://mvuyntiuiwjjjjsshzcb.supabase.co` — table `clients(id uuid, name text, email text, drive_url text)`. A SQL trigger auto-creates the row on signup.

### `chervo-web/apps/` — PWA sub-apps

All apps are served at `ilchervo.com/apps/<slug>/`. They fall into two categories:

**Single-file HTML PWAs** (no build step, edit `index.html` directly):
- `ildraw/` — Canvas drawing board
- `ilme/` — Personal planner/agenda
- `guidecad/` — AutoCAD command reference
- `ilsanitaria/` — Hydraulic/sanitary calculation tool
- `ilcalc/` — Calculator
- `ildjcu/` — Field survey for Declaraciones Juradas de Caracterización Urbana (DJCU); `djcu_cad.html` is a legacy version
- `bitacorapp/` — Project logbook with notes and voice

Each has a `manifest.json` and `sw.js` for PWA installation.

**React/Vite app:**
- `ilframe/` — Steel framing structural CAD tool (the most complex app). React 19 + Vite 8 + react-konva (canvas) + Zustand state + Tailwind CSS v4. Has a dual dev server setup: Vite serves the frontend, an Express server handles AI API calls.

### Design system

All pages share a consistent CSS design system defined inline (no external stylesheet):
- Font: `Geist` (Google Fonts)
- Color tokens: `--bg #ffffff`, `--ink #171717`, `--red #fe0000`, `--gray #8a8d92`, `--plata-l #e5e7ea`
- Brand red is `#fe0000` (not standard red)
- Breakpoint: `760px` (mobile/desktop)

## Commands

### Main site — regenerate `index.html` from Notion

Requires env vars set (see below):
```bash
cd chervo-web
NOTION_TOKEN=... DB_SERVICIOS=... DB_CLIENTES=... DB_HERO=... DB_CONTACTO=... DB_APLICACIONES=... node generate.js
```

### iLFrame (React app)

```bash
cd chervo-web/apps/ilframe
npm install
npm run dev        # Starts Vite (port 5174) + Express API server concurrently
npm run build      # Production build
npm run lint       # ESLint
npm run client     # Vite only
npm run server     # Express API only
```

The Express API server reads `GEMINI_API_KEY` from `.env` (use `dotenv`) and exposes `POST /api/analyze-plan` — uploads a floor plan image and returns structured JSON via Gemini 2.0 Flash.

### Single-file PWAs

No build step. Open `index.html` directly in a browser or serve with any static server:
```bash
npx serve chervo-web/apps/ilcalc
```

## Deployment

- Push to `master` → Vercel auto-deploys all three projects.
- `chervo-web` build command: `node generate.js` (output dir: `.`). The generated `index.html` is the deployable artifact.
- `vercel.json` in `chervo-web/` sets aggressive no-cache headers for HTML and security headers for all routes.
- `ilframe/vercel.json` rewrites all non-API routes to `index.html` (SPA routing).

## Required Environment Variables

| Variable | Where used |
|---|---|
| `NOTION_TOKEN` | `generate.js` — Notion API bearer token |
| `DB_SERVICIOS`, `DB_CLIENTES`, `DB_HERO`, `DB_CONTACTO`, `DB_APLICACIONES` | `generate.js` — Notion database IDs |
| `GEMINI_API_KEY` | `ilframe/server.js` — Google Gemini API |

These must be set in Vercel project settings (not committed). Locally use a `.env` file (gitignored).

## Key Conventions

- **Content changes** to the main site go through Notion, not `index.html` directly.
- **New apps** added to the Notion `DB_APLICACIONES` database appear on the main site automatically after the next deploy.
- The `clients` table `drive_url` field is how you grant a client access to files — assign the Google Drive folder URL there.
- iLFrame's `iLFrame.html` is a legacy standalone file kept for reference; the active version is the React app under `src/`.
- All coordinates in iLFrame use millimeters.
