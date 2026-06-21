import { Router } from 'express';

import { getOmdbApiKey } from '../services/settings';
import { omdbSearch, omdbMovieDetails } from '../services/omdbClient';

export const omdbRouter = Router();

omdbRouter.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '');
  const apiKey = await getOmdbApiKey();
  if (!apiKey) {
    res.status(400).json({ error: 'OMDb API key not configured' });
    return;
  }

  const results = await omdbSearch(apiKey, q);
  res.json(results);
});

omdbRouter.get('/movie/:imdbId', async (req, res) => {
  const apiKey = await getOmdbApiKey();
  if (!apiKey) {
    res.status(400).json({ error: 'OMDb API key not configured' });
    return;
  }

  const imdbId = req.params.imdbId;
  const details = await omdbMovieDetails(apiKey, imdbId);
  res.json(details);
});