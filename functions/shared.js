const dbKind = 'mssql';

let mssqlPromise = null;

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

async function getOmdbApiKey() {
  const pool = await getMssqlPool();
  const result = await pool.request().query("SELECT [value] FROM dbo.settings WHERE [key] = 'omdb-api-key'");
  return result.recordset?.[0]?.value ?? null;
}

async function setOmdbApiKey(apiKey) {
  const pool = await getMssqlPool();
  await pool.request().query(`
    MERGE dbo.settings AS target
    USING (SELECT 'omdb-api-key' AS [key], '${apiKey.replace(/'/g, "''")}' AS [value]) AS source
    ON target.[key] = source.[key]
    WHEN MATCHED THEN UPDATE SET [value] = source.[value]
    WHEN NOT MATCHED THEN INSERT ([key], [value]) VALUES (source.[key], source.[value]);
  `);
}

async function listMovies() {
  const pool = await getMssqlPool();
  const result = await pool
    .request()
    .query('SELECT id, title, year, genre, director, plot, posterUrl FROM dbo.movies ORDER BY title ASC');
  return result.recordset ?? [];
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
  getMssqlPool,
  getOmdbApiKey,
  setOmdbApiKey,
  listMovies,
  omdbSearch,
  omdbMovieDetails
};