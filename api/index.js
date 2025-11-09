// Root /api handler for Vercel (Node Serverless Function)
const serverless = require('serverless-http');
const app = require('../backend/app');

module.exports = serverless(app);
