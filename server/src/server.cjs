// Hostinger LiteSpeed (lsnode) uses require() to load the startup file.
// Since this is an ESM project ("type": "module"), require() fails.
// This CommonJS wrapper dynamically imports the real ESM entry point.

import('./server.js').catch((err) => {
  console.error("Failed to load the ESM server:", err);
  process.exit(1);
});
