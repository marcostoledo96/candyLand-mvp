// Función serverless de Vercel que envuelve nuestra app de Express
const serverless = require('serverless-http');
const app = require('../backend/app');

module.exports = serverless(app);
