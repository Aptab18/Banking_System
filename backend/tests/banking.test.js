/**
 * banking.test.js
 * PhysiOps Banking System — Jest Test Suite
 */

const request = require('supertest');
const app = require('../server');

// ── Accounts ──────────────────────────────────────────────────────────────────
describe('GET /api/accounts', () => {
  it('should return all accounts', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return a specific account by ID', async () => {
    const res = await request(app).get('/api/accounts/ACC001');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe('ACC001');
    expect(res.body.data.holder).toBe('Aptab Shaikh');
  });

  it('should return 404 for a non-existent account', async () => {
    const res = await request(app).get('/api/accounts/ACC999');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return balance for an account', async () => {
    const res = await request(app).get('/api/accounts/ACC001/balance');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.balance).toBe('number');
    expect(res.body.balance).toBeGreaterThan(0);
  });
});

// ── Transactions ──────────────────────────────────────────────────────────────
describe('GET /api/transactions', () => {
  it('should return all transactions', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('should limit transactions with query param', async () => {
    const res = await request(app).get('/api/transactions?limit=3');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
  });

  it('should return transaction stats', async () => {
    const res = await request(app).get('/api/transactions/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalCredit');
    expect(res.body.data).toHaveProperty('totalDebit');
  });
});

// ── CI Status ─────────────────────────────────────────────────────────────────
describe('CI Status API', () => {
  it('GET /api/ci-status should return current status', async () => {
    const res = await request(app).get('/api/ci-status');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status');
  });

  it('POST /api/ci-status should reject without token', async () => {
    const res = await request(app)
      .post('/api/ci-status')
      .send({ status: 'build_success' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/ci-status should update status with valid token', async () => {
    const res = await request(app)
      .post('/api/ci-status')
      .set('x-ci-token', 'dev-secret')
      .send({ status: 'build_success', details: 'Test passed' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('build_success');
  });

  it('POST /api/ci-status should reject invalid status values', async () => {
    const res = await request(app)
      .post('/api/ci-status')
      .set('x-ci-token', 'dev-secret')
      .send({ status: 'invalid_status' });
    expect(res.statusCode).toBe(400);
  });

  it('GET /api/ci-status should reflect the latest status', async () => {
    // Set to build_failed
    await request(app)
      .post('/api/ci-status')
      .set('x-ci-token', 'dev-secret')
      .send({ status: 'build_failed', details: 'Test failure' });

    const res = await request(app).get('/api/ci-status');
    expect(res.body.data.status).toBe('build_failed');
  });
});

// ── Health ────────────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('should return OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});
