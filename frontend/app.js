/**
 * app.js — PhysiOps Banking Dashboard
 * Renders accounts and transactions from the backend.
 * CI/CD status is handled entirely by ESP32 hardware (LEDs + buzzer).
 */

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

// ── Utils ─────────────────────────────────────────────────────────────────────
function fmt(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Clock ─────────────────────────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('nav-time');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// ── Greeting ──────────────────────────────────────────────────────────────────
function updateGreeting() {
  const hour = new Date().getHours();
  const greetings = [
    [5,  12, 'Good morning ☀️'],
    [12, 17, 'Good afternoon 🌤️'],
    [17, 21, 'Good evening 🌆'],
    [21, 24, 'Good night 🌙'],
    [0,  5,  'Good night 🌙'],
  ];
  const text = greetings.find(([from, to]) => hour >= from && hour < to)?.[2] ?? 'Hello';
  const el = document.getElementById('greeting');
  if (el) el.textContent = text;
}
updateGreeting();

// ── Fetch Accounts ────────────────────────────────────────────────────────────
async function fetchAccounts() {
  try {
    const res  = await fetch(`${API_BASE}/accounts`);
    const json = await res.json();
    if (!json.success) return;

    const grid = document.getElementById('accounts-grid');
    grid.innerHTML = '';

    let total = 0;
    json.data.forEach(acc => {
      total += acc.balance;
      const card = document.createElement('div');
      card.className = `account-card ${acc.color}`;
      card.setAttribute('id', `account-card-${acc.id}`);
      card.innerHTML = `
        <div class="card-top">
          <span class="card-type">${acc.type}</span>
          <div class="card-chip"></div>
        </div>
        <div class="card-number">${acc.accountNumber}</div>
        <div class="card-bottom">
          <div>
            <div class="card-holder-label">Account Holder</div>
            <div class="card-holder">${acc.holder}</div>
          </div>
          <div class="card-balance">
            <div class="card-balance-label">Balance</div>
            <div class="card-balance-amt">${fmt(acc.balance)}</div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    document.getElementById('total-balance').textContent = fmt(total);
  } catch (err) {
    console.warn('[Accounts] Backend not reachable:', err.message);
    document.getElementById('accounts-grid').innerHTML = `
      <div style="color:var(--accent-orange);padding:1rem">
        ⚠️ Start the backend to load accounts:<br>
        <code style="font-size:0.8rem;color:var(--text-muted)">cd backend &amp;&amp; node server.js</code>
      </div>`;
  }
}

// ── Fetch Transactions ────────────────────────────────────────────────────────
async function fetchTransactions() {
  try {
    const [txnRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/transactions`),
      fetch(`${API_BASE}/transactions/stats`),
    ]);
    const txnJson   = await txnRes.json();
    const statsJson = await statsRes.json();

    // Stats
    if (statsJson.success) {
      const s = statsJson.data;
      document.getElementById('stat-credit').textContent = fmt(s.totalCredit);
      document.getElementById('stat-debit').textContent  = fmt(s.totalDebit);
      document.getElementById('stat-net').textContent    = fmt(s.netFlow);
      document.getElementById('stat-count').textContent  = s.count;
    }

    // Table
    if (!txnJson.success) return;
    const tbody = document.getElementById('txn-body');
    const badge = document.getElementById('txn-count-badge');
    if (badge) badge.textContent = `${txnJson.count} transactions`;
    tbody.innerHTML = '';

    txnJson.data.forEach(t => {
      const tr = document.createElement('tr');
      const sign = t.type === 'credit' ? '+' : '-';
      tr.innerHTML = `
        <td>${fmtDate(t.date)}</td>
        <td class="txn-description">${t.description}</td>
        <td><span class="txn-category">${t.category}</span></td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--text-muted)">${t.account}</td>
        <td><span class="txn-status ${t.status}">${t.status}</span></td>
        <td class="txn-amount ${t.type}">${sign}${fmt(t.amount)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.warn('[Transactions] Backend not reachable:', err.message);
    document.getElementById('txn-body').innerHTML =
      `<tr><td colspan="6" class="loading-row" style="color:var(--accent-orange)">
        ⚠️ Backend not running. Start it to load transactions.
      </td></tr>`;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
Promise.all([
  fetchAccounts(),
  fetchTransactions(),
]);
