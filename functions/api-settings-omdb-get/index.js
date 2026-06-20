const { getOmdbApiKey } = require('../shared');

module.exports = async function (context, req) {
  const apiKey = await getOmdbApiKey();
  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: { apiKey }
  };
};