# VibeMovies Express API

This folder contains the Express API for VibeMovies.

## What it uses

- Express for the HTTP API
- Azure SQL for data storage
- `dotenv` for local environment variables
- `ts-node-dev` for local development

## Environment

The API reads the Azure SQL connection string from:

- `AZURE_SQL_CONNECTION_STRING`

For local development, put it in [`.env`](.env).

Example:

```env
AZURE_SQL_CONNECTION_STRING=Server=tcp:your-server.database.windows.net,1433;Initial Catalog=your-db;Persist Security Info=False;User ID=your-user;Password=your-password;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

## Run locally

From this folder:

```powershell
npm install
npm run dev
```

`npm run dev` runs in the foreground and starts the API on port `3001`.

## Verify the API

Health check:

```powershell
Invoke-WebRequest http://localhost:3001/api/health -UseBasicParsing
```

Movies endpoint:

```powershell
Invoke-WebRequest http://localhost:3001/api/movies -UseBasicParsing
```

To check whether the API is listening on port `3001`:

```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
```

To stop the running API process, use the PID from the listener check:

```powershell
Stop-Process -Id <PID> -Force
```

## Notes

- The API is started from the `express/` folder, not the repo root.
- The dev script is foreground-friendly and should keep the terminal attached while the server is running.
- The API uses Azure SQL only; SQLite is no longer part of the Express app.
