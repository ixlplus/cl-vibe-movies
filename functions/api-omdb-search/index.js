const { getOmdbApiKey, omdbSearch } = require('../shared');

module.exports = async function (context, req) {
  const q = String(req.query?.q ?? '');
  const apiKey = await getOmdbApiKey();
  if (!apiKey) {
    context.res = {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { error: 'OMDb API key not configured' }
    };
    return;
  }

  const results = await omdbSearch(apiKey, q);
  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: results
  };
};