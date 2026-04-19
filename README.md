# PhysiOps Banking System 🏦 + ESP32 CI/CD Monitor

A full-stack banking dashboard integrated with GitHub Actions CI/CD, with physical hardware feedback via ESP32.

## How It Works

```
git push → GitHub Actions (self-hosted runner on your PC)
              ├── npm install + npm test
              ├── python resource_monitor.py (psutil — checks YOUR PC's RAM & Disk)
              └── curl → ESP32 webhook (192.168.x.x/webhook)
                            ├── build_success → 🟢 Green LED
                            ├── build_failed  → 🔴 Red LED
                            └── ram_warning   → 🔔 Buzzer + blink
                                                    └─ IR sensor → 🔕 Silence
```

**Dashboard shows:** Banking accounts, balances, transaction history only.  
**Hardware shows:** Build status physically on your desk.

---

## Quick Start

### 1. Install Backend
```powershell
cd "c:\Sensor Project Software\banking-system\backend"
npm install
pip install psutil
node server.js
```

### 2. Open Dashboard
Navigate to: **http://localhost:3000**

### 3. Set Up ESP32
See [esp32/README.md](esp32/README.md) for wiring + Arduino IDE setup.

### 4. Set Up GitHub Self-Hosted Runner

Go to your GitHub repo → **Settings → Actions → Runners → New self-hosted runner**  
Select **Windows** and follow the instructions. Then run:

```powershell
# In the runner directory:
.\run.cmd
```

The runner listens for pushes and executes jobs locally on your PC.

### 5. Add GitHub Secrets

`Settings → Secrets → Actions → New repository secret`:

| Secret | Value |
|--------|-------|
| `ESP32_IP` | ESP32 local IP (e.g. `192.168.1.45`) — shown in Serial Monitor |

### 6. Push Code → Watch Hardware React

```bash
git add .
git commit -m "feat: my change"
git push
```

---

## Project Structure

```
banking-system/
├── .github/workflows/banking-ci.yml    # GitHub Actions (self-hosted)
├── backend/
│   ├── server.js                        # Express server (port 3000)
│   ├── routes/
│   │   ├── accounts.js                  # Account data API
│   │   └── transactions.js              # Transaction data API
│   ├── scripts/
│   │   └── resource_monitor.py          # psutil RAM & Disk check
│   └── tests/banking.test.js            # 13 Jest tests
├── frontend/
│   ├── index.html                        # Banking dashboard
│   ├── style.css                         # Dark glassmorphism theme
│   └── app.js                            # Dashboard rendering
└── esp32/
    ├── banking_monitor.ino               # Arduino ESP32 sketch
    ├── config.h                           # WiFi + pin configuration
    └── README.md                          # Wiring + setup guide
```

## CI/CD Logic (Mutually Exclusive — Only One Status)

| Priority | Condition | ESP32 |
|----------|-----------|-------|
| 1st | Tests pass + RAM > 85% or Disk > 90% | 🟠 Buzzer ON |
| 2nd | Tests failed | 🔴 Red LED |
| 3rd | All clear | 🟢 Green LED |

---

*PhysiOps Banking System — Hardware-first CI/CD feedback*
