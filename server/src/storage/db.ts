import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbPromise: Promise<Database.Database> | null = null;

export async function getDb(): Promise<Database.Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
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

  return dbPromise;
}
