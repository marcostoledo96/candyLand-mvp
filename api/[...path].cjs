// Catch-all serverless function for Vercel to handle all /api/* routes with Express
// Ensures that routes like /api/carrito, /api/checkout, etc., are handled by our app.
const serverless = require('serverless-http');
const app = require('../backend/app');

module.exports = serverless(app);
