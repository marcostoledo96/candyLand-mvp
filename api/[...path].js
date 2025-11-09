// Catch-all /api/* handler (e.g., /api/carrito, /api/checkout, etc.)
const serverless = require('serverless-http');
const app = require('../backend/app');

module.exports = serverless(app);
