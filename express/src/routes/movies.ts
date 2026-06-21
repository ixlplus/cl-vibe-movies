import { Router } from 'express';

import { listMovies } from '../services/movies';

export const moviesRouter = Router();

moviesRouter.get('/', async (_req, res) => {
  const movies = await listMovies();
  res.json(movies);
});