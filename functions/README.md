# VibeMovies Azure Functions (local)

## Run locally

1. Install dependencies:
   - `cd functions`
   - `npm install`

2. Make sure a local Azure Storage emulator is running if `AzureWebJobsStorage` is set to `UseDevelopmentStorage=true`.
   - Azurite is the expected local dependency for the Functions host.
   - Start it with: `azurite --silent --location .azurite --debug .azurite\azurite-debug.log`
   - `azurite` starts the local storage emulator.
   - `--silent` reduces console noise.
   - `--location .azurite` stores Azurite data in a local `.azurite` folder.
   - `--debug .azurite\azurite-debug.log` writes debug logs to that file.

3. Start the Functions host:
   - `npm start`

4. Test endpoints:
   - `http://localhost:7071/api/health`
   - `http://localhost:7071/api/movies`

## Env vars

Edit `local.settings.json` for:
- `AzureWebJobsStorage` (must point to a reachable storage account or local Azurite)
- `FUNCTIONS_WORKER_RUNTIME`
- `DB_KIND`
- `OMDB_API_KEY`
- `AZURE_SQL_CONNECTION_STRING`
