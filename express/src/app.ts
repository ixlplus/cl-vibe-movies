import express from 'express';
import cors from 'cors';

import { omdbRouter } from './routes/omdb';
import { healthRouter } from './routes/health';
import { moviesRouter } from './routes/movies';
import { settingsRouter } from './routes/settings';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/health', healthRouter);
  app.use('/api/omdb', omdbRouter);
  app.use('/api/movies', moviesRouter);
  app.use('/api/settings', settingsRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  });

  return app;
}