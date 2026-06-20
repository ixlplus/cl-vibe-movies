const { listMovies } = require('../shared');

module.exports = async function (context, req) {
  const movies = await listMovies();
  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: movies
  };
};