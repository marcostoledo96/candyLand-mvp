// Root /api function (optional convenience)
const serverless = require('serverless-http');
const app = require('../backend/app');

module.exports = serverless(app);
