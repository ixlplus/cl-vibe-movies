// Azure Functions Node worker entry point.
// This repo uses per-function `functions/api/**/index.js` files for HTTP triggers.
// The worker still expects a root `index.js` to exist.
//
// Keep this file CommonJS-compatible (no `export {}`), because the worker loads it as CJS.
module.exports = {};