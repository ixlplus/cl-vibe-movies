const { getOmdbApiKey, omdbMovieDetails } = require('../shared');

module.exports = async function (context, req) {
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

  const imdbId = context.bindingData?.imdbId ?? req.params?.imdbId ?? '';
  const details = await omdbMovieDetails(apiKey, imdbId);
  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: details
  };
};