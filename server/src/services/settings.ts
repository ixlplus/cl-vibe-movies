import { getDb } from '../storage/db';

export async function getOmdbApiKey(): Promise<string | null> {
  const db = await getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('omdb-api-key') as { value?: string } | undefined;
  return row?.value ?? null;
}

export async function setOmdbApiKey(apiKey: string): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  stmt.run('omdb-api-key', apiKey);
}
