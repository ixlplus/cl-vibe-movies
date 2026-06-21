import mssql from 'mssql';

import { getMssqlPool } from '../storage/db';

export async function getOmdbApiKey(): Promise<string | null> {
  const pool = await getMssqlPool();
  const result = await pool
    .request()
    .input('key', mssql.NVarChar, 'omdb-api-key')
    .query('SELECT [value] FROM dbo.settings WHERE [key] = @key');
  const row = result.recordset?.[0] as { value?: string } | undefined;
  return row?.value ?? null;
}

export async function setOmdbApiKey(apiKey: string): Promise<void> {
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
}
