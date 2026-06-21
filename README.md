# VibeMovies (Local Development)

This repo contains two local servers:

1. API server (Express + SQLite) under `server/`
2. Web UI (Vite + React) under `web/`

## Prerequisites

- Node.js (LTS recommended)
- PowerShell (or any terminal)

## 1) Start the API server

From the repo root (`cl-vibe-movies`):

```powershell
npm install
npm run dev
```

The API listens on:

- `http://localhost:3001`

### Quick API checks

Health:

```powershell
curl http://localhost:3001/api/health
```

Movies list:

```powershell
curl http://localhost:3001/api/movies
```

OMDb search (requires an OMDb API key to be configured in the app’s settings):

```powershell
curl "http://localhost:3001/api/omdb/search?q=matrix"
```

## 2) Start the Web UI

In a second terminal, go to the `web/` folder:

```powershell
cd web
npm install
npm run dev
```

The web UI listens on:

- `http://localhost:5173`

### Choose the backend

There are two local choices for the web app:

1. Express mode:
	- set `VITE_API_BASE=http://localhost:3001`
	- the browser calls the Express API directly
2. Proxy mode, recommended for local dev:
	- leave `VITE_API_BASE` empty in `web/.env`
	- Vite proxies `/api` to `http://localhost:7071`
3. Direct Functions mode:
	- set `VITE_API_BASE=http://localhost:7071`
	- the browser calls Functions directly, so CORS must work

Use `web/.env.example` for proxy mode, `web/.env.functions.example` for direct Functions mode, or set `VITE_API_BASE=http://localhost:3001` for Express mode before starting Vite.

## Configure OMDb API key (so `/api/omdb/*` works)

The API reads the OMDb API key from the local SQLite database settings table (key: `omdb-api-key`).

1. Start the API server and the web UI (steps above).
2. Use the app’s Settings page to set your OMDb API key.
3. Re-try OMDb endpoints (or refresh the UI).

If the key is missing, the API returns `400` with `OMDb API key not configured`.

## Notes

- The web UI dev server uses port `5173` with `strictPort: true`.
- The API dev server uses port `3001` by default (override via `PORT` env var if needed).

## Database mode (SQLite locally, Azure SQL in production)

The API can run with either:

- SQLite (default): stored locally under `server/data/vibemovies.sqlite` (created automatically)
- Azure SQL (SQL Server): configured via environment variables

### Environment variables

Set these on the API host (locally or in Azure):

- `DB_KIND`
	- `sqlite` (default)
	- `mssql` (Azure SQL)
- `AZURE_SQL_CONNECTION_STRING`
	- required only when `DB_KIND=mssql`

### Azure SQL schema

When `DB_KIND=mssql`, the API will create the required tables on first run:

- `dbo.settings` (stores `omdb-api-key`)
- `dbo.movies`

## Azure Functions local mode

The Functions app under `functions/` now honors the same `DB_KIND` setting:

- `sqlite` uses the local Functions SQLite store
- `mssql` uses Azure SQL with the same `settings` and `movies` tables

Set `DB_KIND` and `AZURE_SQL_CONNECTION_STRING` in `functions/local.settings.json` when you want the Functions host to use Azure SQL.

## How the app is structured

At a high level, the app is split into a React front end and an Express API back end.

### Front end (`web/`)

- `web/src/main.tsx`: React entry point.
- `web/src/ui/App.tsx`: Single-page UI with two routes:
	- `/` (home): OMDb search + movie details, plus a local “saved movies” list.
	- `/settings`: OMDb API key input.
- The UI calls the API at `http://localhost:3001` (see `API_BASE` in `web/src/ui/App.tsx`).
- Saved movies are stored in the browser’s `localStorage` under `vibemovies:saved`.

### API / middleware (`server/`)

- `server/src/index.ts`: Starts the Express server and listens on `PORT` (default `3001`).
- `server/src/app.ts`: Creates the Express app and wires middleware + routes:
	- `cors()` to allow cross-origin requests from the web UI.
	- `express.json()` for JSON request bodies.
	- Route mounting:
		- `/api/health` (health check)
		- `/api/omdb` (OMDb search + movie details)
		- `/api/movies` (list movies)
		- `/api/settings` (read/write OMDb API key)
- `server/src/routes/*`: HTTP route handlers.
- `server/src/services/*`: Business logic and external integrations.
	- `services/omdbClient.ts`: Calls the OMDb HTTP API.
	- `services/settings.ts`: Reads/writes the OMDb API key in the database.

### Database (`data/vibemovies.sqlite`)

- `server/src/storage/db.ts` creates/opens a SQLite database at `data/vibemovies.sqlite`.
- On first run it creates two tables:
	- `settings(key TEXT PRIMARY KEY, value TEXT NOT NULL)`
	- `movies(id TEXT PRIMARY KEY, title TEXT NOT NULL, ...)`
- The OMDb API key is stored in `settings` under the key `omdb-api-key`.

When using Azure SQL (`DB_KIND=mssql`), the same logical tables are created in `dbo`.

