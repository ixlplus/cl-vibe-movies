# VibeMovies

This repository is split into separate layers, each with its own folder and responsibility:

1. [express/](express/) - Express API, Azure SQL data access, and OMDb integration
2. [web/](web/) - Vite + React front end
3. [functions/](functions/) - Azure Functions app and HTTP triggers

## Project Layout

- [express/README.md](express/README.md) documents the Express API setup, environment variables, and local run steps.
- [web/](web/) contains the browser UI.
- [functions/](functions/) contains the Azure Functions app.

## Express API

The Express API is now Azure SQL-only.

- It reads the connection string from `AZURE_SQL_CONNECTION_STRING`.
- It uses `ts-node-dev` for local development.
- It runs from the [express/](express/) folder, not the repo root.
- SQLite has been removed from the Express layer.

See [express/README.md](express/README.md) for the current Express-specific setup and verification commands.

## Front End

The front end lives in [web/](web/).

- React entry point: [web/src/main.tsx](web/src/main.tsx)
- UI: [web/src/ui/App.tsx](web/src/ui/App.tsx)

The UI can point at the Express API by setting `VITE_API_BASE=http://localhost:3001`.

## Azure Functions

The Azure Functions app lives in [functions/](functions/).

- Local Functions settings are in [functions/local.settings.json](functions/local.settings.json)
- The Functions app has its own HTTP trigger folders under [functions/api/](functions/api/)

## Local Development

Start each layer from its own folder:

```powershell
cd express
npm install
npm run dev
```

```powershell
cd web
npm install
npm run dev
```

```powershell
cd functions
npm install
npm start
```

## Verification

Express API health check:

```powershell
Invoke-WebRequest http://localhost:3001/api/health -UseBasicParsing
```

Express API movies endpoint:

```powershell
Invoke-WebRequest http://localhost:3001/api/movies -UseBasicParsing
```

Check whether Express is listening on port 3001:

```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
```

Stop the Express process by PID:

```powershell
Stop-Process -Id <PID> -Force
```

## Notes

- The repo root no longer contains the old Node wrapper files or the root SQLite data folder.
- The Express API uses Azure SQL only.
- The root README is now just a map of the refactored layers and a pointer to the folder-specific docs.

