const { getOmdbApiKey } = require('../shared');

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  const apiKey = await getOmdbApiKey();
  context.res = {
    status: 200,
    headers: corsHeaders,
    body: { apiKey }
  };
};