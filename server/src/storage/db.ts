import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

type DbKind = 'sqlite' | 'mssql';

const dbKind: DbKind = process.env.DB_KIND === 'mssql' ? 'mssql' : 'sqlite';

let sqliteDbPromise: Promise<Database.Database> | null = null;

// For Azure SQL we use the `mssql` package (installed only when DB_KIND=mssql).
// This keeps local SQLite dev simple.
let mssqlPromise: Promise<import('mssql').ConnectionPool> | null = null;

export async function getDbKind(): Promise<DbKind> {
  return dbKind;
}

export async function getSqliteDb(): Promise<Database.Database> {
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

async function ensureMssqlSchema(pool: import('mssql').ConnectionPool): Promise<void> {
  // Minimal schema creation for Azure SQL.
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

export async function getMssqlPool(): Promise<import('mssql').ConnectionPool> {
  if (!mssqlPromise) {
    mssqlPromise = (async () => {
      const mssql = await import('mssql');

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

// Backwards-compatible helper for existing code paths.
// Prefer using getSqliteDb/getMssqlPool directly in new code.
export async function getDb(): Promise<Database.Database> {
  if (dbKind !== 'sqlite') {
    throw new Error('getDb() is SQLite-only. Use getSqliteDb() or getMssqlPool() instead.');
  }
  return getSqliteDb();
}
