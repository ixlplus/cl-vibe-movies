const { setOmdbApiKey } = require('../shared');

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

  const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey : '';
  if (!apiKey.trim()) {
    context.res = {
      status: 400,
      headers: corsHeaders,
      body: { error: 'apiKey is required' }
    };
    return;
  }

  await setOmdbApiKey(apiKey.trim());
  context.res = {
    status: 200,
    headers: corsHeaders,
    body: { ok: true }
  };
};