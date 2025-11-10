// Serverless function for /api root that wraps the Express app
const serverless = require('serverless-http');
const app = require('../backend/app');

module.exports = serverless(app);
