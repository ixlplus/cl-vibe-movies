import dotenv from 'dotenv';

import { createApp } from './app';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`VibeMovies API listening on http://localhost:${port}`);
});