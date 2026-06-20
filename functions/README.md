# VibeMovies Azure Functions (local)

## Run locally

1. Install dependencies:
   - `cd functions`
   - `npm install`

2. Start the Functions host:
   - `npm start`

3. Test endpoints:
   - `http://localhost:7071/api/health`
   - `http://localhost:7071/api/movies`

## Env vars

Edit `local.settings.json` for:
- `DB_KIND` (sqlite or mssql)
- `OMDB_API_KEY`
- `AZURE_SQL_CONNECTION_STRING`
