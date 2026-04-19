const express = require('express');
const router = express.Router();

// ── Mock Data ─────────────────────────────────────────────────────────────────
const accounts = [
  {
    id: 'ACC001',
    accountNumber: '4532 •••• •••• 7821',
    holder: 'Aptab Shaikh',
    type: 'Savings',
    balance: 285430.50,
    currency: 'INR',
    bank: 'PhysiOps Bank',
    ifsc: 'PHYS0001234',
    color: 'blue',
  },
  {
    id: 'ACC002',
    accountNumber: '3782 •••• •••• 1947',
    holder: 'Aptab Shaikh',
    type: 'Current',
    balance: 924100.00,
    currency: 'INR',
    bank: 'PhysiOps Bank',
    ifsc: 'PHYS0001234',
    color: 'purple',
  },
  {
    id: 'ACC003',
    accountNumber: '6011 •••• •••• 3356',
    holder: 'Aptab Shaikh',
    type: 'Fixed Deposit',
    balance: 1500000.00,
    currency: 'INR',
    bank: 'PhysiOps Bank',
    ifsc: 'PHYS0001234',
    color: 'green',
  },
];

// ── Routes ────────────────────────────────────────────────────────────────────
// GET all accounts
router.get('/', (req, res) => {
  res.json({ success: true, data: accounts });
});

// GET single account
router.get('/:id', (req, res) => {
  const account = accounts.find(a => a.id === req.params.id);
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  res.json({ success: true, data: account });
});

// GET balance for account
router.get('/:id/balance', (req, res) => {
  const account = accounts.find(a => a.id === req.params.id);
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  res.json({ success: true, balance: account.balance, currency: account.currency });
});

module.exports = router;
