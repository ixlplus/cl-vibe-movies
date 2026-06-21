const { getOmdbApiKey, omdbSearch } = require('../shared');

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  const q = String(req.query?.q ?? '');
  const apiKey = await getOmdbApiKey();
  if (!apiKey) {
    context.res = {
      status: 400,
      headers: corsHeaders,
      body: { error: 'OMDb API key not configured' }
    };
    return;
  }

  const results = await omdbSearch(apiKey, q);
  context.res = {
    status: 200,
    headers: corsHeaders,
    body: results
  };
};