// Polyfill for Node < 20: util.styleText used by RN CLI.
// Keeps dev tooling working on Node 18 without changing runtime app code.
const util = require('node:util');

if (typeof util.styleText !== 'function') {
  util.styleText = (_style, text) => String(text);
}

