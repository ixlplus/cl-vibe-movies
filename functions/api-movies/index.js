const { listMovies, getMssqlPool } = require('../shared');

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

async function saveMovie(movie) {
  const pool = await getMssqlPool();
  await pool.request().query(`
    MERGE dbo.movies AS target
    USING (
      SELECT
        '${movie.id.replace(/'/g, "''")}' AS id,
        '${movie.title.replace(/'/g, "''")}' AS title,
        ${movie.year === null || movie.year === undefined ? 'NULL' : Number(movie.year)} AS year,
        ${movie.genre === null || movie.genre === undefined ? 'NULL' : `'${String(movie.genre).replace(/'/g, "''")}'`} AS genre,
        ${movie.director === null || movie.director === undefined ? 'NULL' : `'${String(movie.director).replace(/'/g, "''")}'`} AS director,
        ${movie.plot === null || movie.plot === undefined ? 'NULL' : `'${String(movie.plot).replace(/'/g, "''")}'`} AS plot,
        ${movie.posterUrl === null || movie.posterUrl === undefined ? 'NULL' : `'${String(movie.posterUrl).replace(/'/g, "''")}'`} AS posterUrl
    ) AS source
    ON target.id = source.id
    WHEN MATCHED THEN UPDATE SET
      title = source.title,
      year = source.year,
      genre = source.genre,
      director = source.director,
      plot = source.plot,
      posterUrl = source.posterUrl
    WHEN NOT MATCHED THEN
      INSERT (id, title, year, genre, director, plot, posterUrl)
      VALUES (source.id, source.title, source.year, source.genre, source.director, source.plot, source.posterUrl);
  `);
  return movie;
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  if (req.method === 'POST') {
    const movie = req.body || {};
    if (!movie.id || !movie.title) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'id and title are required' }
      };
      return;
    }

    const saved = await saveMovie({
      id: movie.id,
      title: movie.title,
      year: movie.year ?? null,
      genre: movie.genre ?? null,
      director: movie.director ?? null,
      plot: movie.plot ?? null,
      posterUrl: movie.posterUrl ?? null
    });

    context.res = {
      status: 201,
      headers: corsHeaders,
      body: saved
    };
    return;
  }

  const rows = await listMovies();
  context.res = {
    status: 200,
    headers: corsHeaders,
    body: rows
  };
};