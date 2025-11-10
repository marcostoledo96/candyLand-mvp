// Root /api function: delegate to Express app handler
const app = require('../backend/app');
module.exports = (req, res) => app(req, res);
