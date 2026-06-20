import { getMssqlPool, getSqliteDb } from '../storage/db';

export async function getOmdbApiKey(): Promise<string | null> {
  if (process.env.DB_KIND === 'mssql') {
    const mssql = await import('mssql');
    const pool = await getMssqlPool();
    const result = await pool
      .request()
      .input('key', mssql.NVarChar, 'omdb-api-key')
      .query('SELECT [value] FROM dbo.settings WHERE [key] = @key');
    const row = result.recordset?.[0] as { value?: string } | undefined;
    return row?.value ?? null;
  }

  const db = await getSqliteDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('omdb-api-key') as { value?: string } | undefined;
  return row?.value ?? null;
}

export async function setOmdbApiKey(apiKey: string): Promise<void> {
  if (process.env.DB_KIND === 'mssql') {
    const mssql = await import('mssql');
    const pool = await getMssqlPool();
    await pool
      .request()
      .input('key', mssql.NVarChar, 'omdb-api-key')
      .input('value', mssql.NVarChar, apiKey)
      .query(`
        MERGE dbo.settings AS target
        USING (SELECT @key AS [key], @value AS [value]) AS source
        ON target.[key] = source.[key]
        WHEN MATCHED THEN UPDATE SET target.[value] = source.[value]
        WHEN NOT MATCHED THEN INSERT ([key], [value]) VALUES (source.[key], source.[value]);
      `);
    return;
  }

  const db = await getSqliteDb();
  const stmt = db.prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  stmt.run('omdb-api-key', apiKey);
}
