import mssql from 'mssql';

let poolPromise: Promise<mssql.ConnectionPool> | null = null;

async function ensureSchema(pool: mssql.ConnectionPool): Promise<void> {
  await pool.request().query(`
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

export async function getMssqlPool(): Promise<mssql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = (async () => {
      const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
      if (!connectionString) {
        throw new Error('AZURE_SQL_CONNECTION_STRING is required');
      }

      const pool = new mssql.ConnectionPool(connectionString);
      await pool.connect();
      await ensureSchema(pool);
      return pool;
    })();
  }

  return poolPromise;
}
