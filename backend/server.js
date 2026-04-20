const express = require('express');
const cors = require('cors');
const path = require('path');

const accountsRouter = require('./routes/accounts');
const transactionsRouter = require('./routes/transactions');
const ciStatusRouter = require('./routes/ci-status');

const app = express();
const PORT = process.env.PORT || 3000;

//this_is_not_valid_javascript!!!

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/ci-status', ciStatusRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Serve frontend for all other routes ──────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Start server ─────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🏦 PhysiOps Banking Server running at http://localhost:${PORT}`);
    console.log(`📡 CI Status webhook: POST http://localhost:${PORT}/api/ci-status`);
    console.log(`🔑 Dev CI Token: dev-secret\n`);
  });
}

module.exports = app;
