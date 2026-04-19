const express = require('express');
const router = express.Router();

// ── Mock Transaction Data ─────────────────────────────────────────────────────
const transactions = [
  { id: 'TXN001', date: '2026-03-26', description: 'Salary Credit',        type: 'credit', amount: 85000,  account: 'ACC001', status: 'success', category: 'Income' },
  { id: 'TXN002', date: '2026-03-25', description: 'Amazon Purchase',       type: 'debit',  amount: 3499,   account: 'ACC001', status: 'success', category: 'Shopping' },
  { id: 'TXN003', date: '2026-03-24', description: 'Netflix Subscription',  type: 'debit',  amount: 649,    account: 'ACC002', status: 'success', category: 'Entertainment' },
  { id: 'TXN004', date: '2026-03-23', description: 'UPI Transfer — Rahul',  type: 'debit',  amount: 5000,   account: 'ACC001', status: 'success', category: 'Transfer' },
  { id: 'TXN005', date: '2026-03-22', description: 'Dividend Credit',       type: 'credit', amount: 12400,  account: 'ACC002', status: 'success', category: 'Income' },
  { id: 'TXN006', date: '2026-03-21', description: 'Electricity Bill',      type: 'debit',  amount: 2100,   account: 'ACC001', status: 'success', category: 'Bills' },
  { id: 'TXN007', date: '2026-03-20', description: 'Swiggy Order',          type: 'debit',  amount: 480,    account: 'ACC001', status: 'success', category: 'Food' },
  { id: 'TXN008', date: '2026-03-19', description: 'Freelance Payment',     type: 'credit', amount: 45000,  account: 'ACC002', status: 'success', category: 'Income' },
  { id: 'TXN009', date: '2026-03-18', description: 'IRCTC Train Ticket',    type: 'debit',  amount: 1240,   account: 'ACC001', status: 'pending', category: 'Travel' },
  { id: 'TXN010', date: '2026-03-17', description: 'Mutual Fund SIP',       type: 'debit',  amount: 10000,  account: 'ACC002', status: 'success', category: 'Investment' },
  { id: 'TXN011', date: '2026-03-16', description: 'Insurance Premium',     type: 'debit',  amount: 8500,   account: 'ACC002', status: 'success', category: 'Insurance' },
  { id: 'TXN012', date: '2026-03-15', description: 'ATM Withdrawal',        type: 'debit',  amount: 5000,   account: 'ACC001', status: 'success', category: 'Cash' },
];

// ── Routes ────────────────────────────────────────────────────────────────────
// GET all transactions (optional filter by accountId)
router.get('/', (req, res) => {
  const { accountId, limit } = req.query;
  let result = transactions;
  if (accountId) {
    result = result.filter(t => t.account === accountId);
  }
  if (limit) {
    result = result.slice(0, parseInt(limit));
  }
  res.json({ success: true, count: result.length, data: result });
});

// GET stats
router.get('/stats', (req, res) => {
  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit  = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  res.json({ success: true, data: { totalCredit, totalDebit, netFlow: totalCredit - totalDebit, count: transactions.length } });
});

// POST transfer (simulated)
router.post('/transfer', (req, res) => {
  const { from, to, amount, description } = req.body;
  if (!from || !to || !amount) {
    return res.status(400).json({ success: false, message: 'from, to, and amount are required' });
  }
  const newTxn = {
    id: `TXN${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    description: description || 'Transfer',
    type: 'debit',
    amount: parseFloat(amount),
    account: from,
    status: 'success',
    category: 'Transfer',
  };
  transactions.unshift(newTxn);
  res.json({ success: true, message: 'Transfer successful', data: newTxn });
});

module.exports = router;
