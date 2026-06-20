const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

let sqliteDbPromise = null;

async function getSqliteDb() {
  if (!sqliteDbPromise) {
    sqliteDbPromise = (async () => {
      const dataDir = path.join(process.cwd(), 'data');
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

async function getOmdbApiKey() {
  const db = await getSqliteDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('omdb-api-key');
  return row?.value ?? null;
}

async function setOmdbApiKey(apiKey) {
  const db = await getSqliteDb();
  const stmt = db.prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  stmt.run('omdb-api-key', apiKey);
}

async function listMovies() {
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
  getOmdbApiKey,
  setOmdbApiKey,
  listMovies,
  omdbSearch,
  omdbMovieDetails
};