# ESP32 Banking Monitor — Setup Guide

## What This Does

The ESP32 receives HTTP webhooks from GitHub Actions and responds physically:

| GitHub Actions Result | ESP32 Response |
|----------------------|----------------|
| Build Successful | 🟢 Green LED ON |
| Build Failed | 🔴 Red LED ON |
| RAM/Disk > threshold | 🔔 Buzzer ON + both LEDs blink alternately |
| Hand in front of IR sensor | 🔕 Buzzer silenced, status reset to idle |

---

## Wiring Diagram

```
                         ESP32 DevKit v1
                    ┌─────────────────────┐
                    │                     │
   Green LED (+) ───┤ GPIO 26             │
   (220Ω to GND)    │                     │
                    │                     │
   Red LED (+)  ───┤ GPIO 27             │
   (220Ω to GND)    │                     │
                    │                     │
   Buzzer (+)   ───┤ GPIO 25             │
   Buzzer (-)   ───┤ GND                 │
                    │                     │
   IR OUT       ───┤ GPIO 34             │
   IR VCC       ───┤ 3.3V                │
   IR GND       ───┤ GND                 │
                    └─────────────────────┘

LED Circuit:
  ESP32 GPIO → 220Ω resistor → LED (+) → LED (-) → GND

IR Sensor (e.g., HW-201 or FC-51):
  LOW  = object/hand detected (triggers buzzer OFF)
  HIGH = no object
```

---

## Prerequisites

### Arduino IDE Setup

1. Open **Arduino IDE**
2. Go to `File → Preferences → Additional Board Manager URLs`:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to `Tools → Board → Boards Manager` → search **esp32** → install **"esp32 by Espressif Systems"**
4. Select board: `Tools → Board → ESP32 Arduino → ESP32 Dev Module`

### Required Libraries (Library Manager)

| Library | Author | Install via |
|---------|--------|-------------|
| **ArduinoJson** | Benoit Blanchon | Library Manager (search: ArduinoJson) |
| **WebServer** | ESP32 built-in | Comes with ESP32 core |

---

## Quick Start

### Step 1 — Edit config.h

```cpp
#define WIFI_SSID     "YourWiFiName"
#define WIFI_PASSWORD "YourWiFiPassword"
```

### Step 2 — Upload

1. Open `banking_monitor.ino` in Arduino IDE
2. Select correct COM port: `Tools → Port`
3. Click **Upload** (→)
4. Open **Serial Monitor** at **115200 baud**
5. Note the IP address printed:
   ```
   [WiFi] Connected! IP address: 192.168.1.45
   >>> Copy this IP into your GitHub Secret: ESP32_IP <<<
   ```

### Step 3 — Add GitHub Secret

In your GitHub repo:
`Settings → Secrets and variables → Actions → New repository secret`

| Name | Value |
|------|-------|
| `ESP32_IP` | e.g. `192.168.1.45` |

---

## Test with curl (from your PC)

```bash
# Test build success → Green LED
curl -X POST http://192.168.1.45/webhook \
  -H "Content-Type: application/json" \
  -d '{"status":"build_success"}'

# Test build failed → Red LED
curl -X POST http://192.168.1.45/webhook \
  -H "Content-Type: application/json" \
  -d '{"status":"build_failed"}'

# Test RAM warning → Buzzer ON
curl -X POST http://192.168.1.45/webhook \
  -H "Content-Type: application/json" \
  -d '{"status":"ram_warning"}'

# Diagnostic — current state
curl http://192.168.1.45/status
```

> **Same network required:** Your PC and ESP32 must be on the same WiFi network.  
> The self-hosted GitHub Actions runner runs on your PC → same network → can reach ESP32.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| WiFi not connecting | Double-check SSID/password in config.h |
| Can't curl ESP32 | Verify both devices on same WiFi |
| IR sensor not silencing | Change `IR_TRIGGERED_STATE` in config.h to `HIGH` |
| LED not lighting | Check 220Ω resistor, verify GPIO pins match config.h |
| Buzzer continuous sound | Trigger IR sensor (wave hand in front) |
