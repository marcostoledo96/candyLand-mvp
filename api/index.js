// Root /api function: delegate to Express app handler with basic logging
const app = require('../backend/app');
module.exports = (req, res) => {
	if (process.env.VERCEL) {
		console.log(`[api/index] ${req.method} ${req.url}`);
	}
	return app(req, res);
};
