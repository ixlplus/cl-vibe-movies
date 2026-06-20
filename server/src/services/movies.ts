import { getDb } from '../storage/db';

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
  const db = await getDb();
  const rows = db.prepare('SELECT id, title, year, genre, director, plot, posterUrl FROM movies ORDER BY title ASC').all() as MovieRow[];
  return rows;
}
