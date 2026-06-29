// DEPRECATED — Railway is now the official API backend.
// Vercel is frontend-only: vercel.json no longer rewrites /api/* to this function.
// The frontend calls the Railway backend directly via VITE_API_URL.
// This file is kept temporarily for rollback safety; safe to remove once the
// Railway backend is confirmed stable in production.
// See docs/DEPLOY_RAILWAY_VERCEL.md for the separation plan.
const serverless = require('serverless-http');
const app = require('../backend/app');

module.exports = serverless(app);
