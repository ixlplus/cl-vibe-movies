const { setOmdbApiKey } = require('../shared');

module.exports = async function (context, req) {
  const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey : '';
  if (!apiKey.trim()) {
    context.res = {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: { error: 'apiKey is required' }
    };
    return;
  }

  await setOmdbApiKey(apiKey.trim());
  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: { ok: true }
  };
};