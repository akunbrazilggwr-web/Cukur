// Vercel serverless entry point. Express app is exported, not listen()'d.
const app = require('../server');
module.exports = app;
