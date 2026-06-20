import { getMssqlPool, getSqliteDb } from '../storage/db';

export type MovieRow = {
  id: string;
  title: string;
  year: number | null;
  genre: string | null;
  director: string | null;
  plot: string | null;
  posterUrl: string | null;
};

export async function listMovies(): Promise<MovieRow[]> {
  if (process.env.DB_KIND === 'mssql') {
    const pool = await getMssqlPool();
    const result = await pool
      .request()
      .query('SELECT id, title, year, genre, director, plot, posterUrl FROM dbo.movies ORDER BY title ASC');
    return (result.recordset ?? []) as MovieRow[];
  }

  const db = await getSqliteDb();
  const rows = db.prepare('SELECT id, title, year, genre, director, plot, posterUrl FROM movies ORDER BY title ASC').all() as MovieRow[];
  return rows;
}
