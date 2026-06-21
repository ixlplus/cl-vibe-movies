const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbKind = process.env.DB_KIND === 'mssql' ? 'mssql' : 'sqlite';

let sqliteDbPromise = null;
let mssqlPromise = null;

async function getSqliteDb() {
  if (!sqliteDbPromise) {
    sqliteDbPromise = (async () => {
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const dbPath = path.join(dataDir, 'vibemovies.sqlite');
      const db = new Database(dbPath);

      db.exec(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS movies (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          year INTEGER,
          genre TEXT,
          director TEXT,
          plot TEXT,
          posterUrl TEXT
        );
      `);

      return db;
    })();
  }

  return sqliteDbPromise;
}

async function ensureMssqlSchema(pool) {
  await pool
    .request()
    .query(`
      IF OBJECT_ID('dbo.settings', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.settings (
          [key] NVARCHAR(255) NOT NULL PRIMARY KEY,
          [value] NVARCHAR(MAX) NOT NULL
        );
      END;

      IF OBJECT_ID('dbo.movies', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.movies (
          id NVARCHAR(255) NOT NULL PRIMARY KEY,
          title NVARCHAR(255) NOT NULL,
          year INT NULL,
          genre NVARCHAR(255) NULL,
          director NVARCHAR(255) NULL,
          plot NVARCHAR(MAX) NULL,
          posterUrl NVARCHAR(MAX) NULL
        );
      END;
    `);
}

async function getMssqlPool() {
  if (!mssqlPromise) {
    mssqlPromise = (async () => {
      const mssqlModule = await import('mssql');
      const mssql = mssqlModule.default ?? mssqlModule;
      const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
      if (!connectionString) {
        throw new Error('AZURE_SQL_CONNECTION_STRING is required when DB_KIND=mssql');
      }

      const pool = new mssql.ConnectionPool(connectionString);
      await pool.connect();
      await ensureMssqlSchema(pool);
      return pool;
    })();
  }

  return mssqlPromise;
}

async function getDb() {
  if (dbKind === 'mssql') {
    return getMssqlPool();
  }

  return getSqliteDb();
}

async function getOmdbApiKey() {
  if (dbKind === 'mssql') {
    const pool = await getMssqlPool();
    const result = await pool.request().query("SELECT [value] FROM dbo.settings WHERE [key] = 'omdb-api-key'");
    return result.recordset?.[0]?.value ?? null;
  }

  const db = await getSqliteDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('omdb-api-key');
  return row?.value ?? null;
}

async function setOmdbApiKey(apiKey) {
  if (dbKind === 'mssql') {
    const pool = await getMssqlPool();
    await pool.request().query(`
      MERGE dbo.settings AS target
      USING (SELECT 'omdb-api-key' AS [key], '${apiKey.replace(/'/g, "''")}' AS [value]) AS source
      ON target.[key] = source.[key]
      WHEN MATCHED THEN UPDATE SET [value] = source.[value]
      WHEN NOT MATCHED THEN INSERT ([key], [value]) VALUES (source.[key], source.[value]);
    `);
    return;
  }

  const db = await getSqliteDb();
  const stmt = db.prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  stmt.run('omdb-api-key', apiKey);
}

async function listMovies() {
  if (dbKind === 'mssql') {
    const pool = await getMssqlPool();
    const result = await pool
      .request()
      .query('SELECT id, title, year, genre, director, plot, posterUrl FROM dbo.movies ORDER BY title ASC');
    return result.recordset ?? [];
  }

  const db = await getSqliteDb();
  return db.prepare('SELECT id, title, year, genre, director, plot, posterUrl FROM movies ORDER BY title ASC').all();
}

async function omdbSearch(apiKey, query) {
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&s=${encodeURIComponent(query)}&type=movie`;
  const resp = await fetch(url);
  const json = await resp.json();
  if (json.Response !== 'True' || !json.Search) return [];
  return json.Search;
}

async function omdbMovieDetails(apiKey, imdbId) {
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&i=${encodeURIComponent(imdbId)}&plot=full`;
  const resp = await fetch(url);
  return await resp.json();
}

module.exports = {
  dbKind,
  getSqliteDb,
  getMssqlPool,
  getDb,
  getOmdbApiKey,
  setOmdbApiKey,
  listMovies,
  omdbSearch,
  omdbMovieDetails
};