// Catch-all serverless function for all /api/* routes using Express app
const serverless = require('serverless-http');
const app = require('../backend/app');

module.exports = serverless(app);
