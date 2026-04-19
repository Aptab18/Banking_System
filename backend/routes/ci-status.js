const express = require('express');
const router = express.Router();

// ── In-memory CI status store ─────────────────────────────────────────────────
// Status is always ONE of: "build_success" | "build_failed" | "ram_warning" | "idle"
let ciStatus = {
  status: 'idle',
  details: 'No builds triggered yet.',
  timestamp: new Date().toISOString(),
  commit: null,
  branch: null,
  runUrl: null,
};

// ── Auth middleware ───────────────────────────────────────────────────────────
function verifyToken(req, res, next) {
  const token = req.headers['x-ci-token'];
  const expected = process.env.CI_SECRET_TOKEN || 'dev-secret';
  if (!token || token !== expected) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid CI token' });
  }
  next();
}

// ── POST /api/ci-status ── Receive webhook from GitHub Actions ───────────────
router.post('/', verifyToken, (req, res) => {
  const { status, details, commit, branch, runUrl } = req.body;

  const validStatuses = ['build_success', 'build_failed', 'ram_warning'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  // Update the single stored status (replaces previous — only ONE at a time)
  ciStatus = {
    status,
    details: details || '',
    timestamp: new Date().toISOString(),
    commit: commit || null,
    branch: branch || null,
    runUrl: runUrl || null,
  };

  console.log(`[CI] Status updated → ${status} | ${details}`);
  res.json({ success: true, message: 'CI status updated', data: ciStatus });
});

// ── GET /api/ci-status ── Frontend polls this every 5s ───────────────────────
router.get('/', (req, res) => {
  res.json({ success: true, data: ciStatus });
});

// ── POST /api/ci-status/reset ── Reset to idle ───────────────────────────────
router.post('/reset', verifyToken, (req, res) => {
  ciStatus = {
    status: 'idle',
    details: 'Manually reset.',
    timestamp: new Date().toISOString(),
    commit: null,
    branch: null,
    runUrl: null,
  };
  res.json({ success: true, message: 'Status reset to idle' });
});

module.exports = router;
