import { Router } from 'express';

import { getOmdbApiKey, setOmdbApiKey } from '../services/settings';

export const settingsRouter = Router();

settingsRouter.get('/omdb', async (_req, res) => {
  const apiKey = await getOmdbApiKey();
  res.json({ apiKey });
});

settingsRouter.post('/omdb', async (req, res) => {
  const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey : '';
  if (!apiKey.trim()) {
    res.status(400).json({ error: 'apiKey is required' });
    return;
  }

  await setOmdbApiKey(apiKey.trim());
  res.json({ ok: true });
});