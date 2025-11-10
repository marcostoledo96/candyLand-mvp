// Root /api function: export Express app directly (no serverless-http wrapper)
const app = require('../backend/app');
module.exports = app;
