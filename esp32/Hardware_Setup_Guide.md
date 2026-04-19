# ESP32 Banking Monitor - Hardware Setup Guide

This guide provides step-by-step instructions on how to build and wire the hardware components for the PhysiOps Banking Monitor.

## 🛠️ Components Required

1. **ESP32 Development Board** (NodeMCU or similar)
2. **Green LED** × 1
3. **Red LED** × 1
4. **Resistors (220Ω or 330Ω)** × 2 (for the LEDs)
5. **Active Buzzer** × 1
6. **IR Proximity Sensor** (Obstacle Avoidance Module) × 1
7. **Servo Motor** (e.g., SG90) × 1
8. **Breadboard** × 1
9. **Jumper Wires** (Male-to-Male, Male-to-Female)

---

## 🔌 Step-by-Step Wiring Connections

### 1. Power Distribution (Breadboard)
First, let's create common Power (`VCC`) and Ground (`GND`) rails on your breadboard.
- Connect the **VIN / 5V** pin of the ESP32 to the **Red (+)** Rail of the breadboard. *(Servos and IR sensors run best on 5V)*.
- Connect a **GND** pin of the ESP32 to the **Blue/Black (-)** Rail of the breadboard.

### 2. Green LED (Build Success Indicator)
- **Anode (Long leg, +)**: Connect to **Pin 26** on the ESP32.
- **Cathode (Short leg, -)**: Connect to a **220Ω resistor**, and connect the other end of the resistor to the **GND** rail.

### 3. Red LED (Build Failed Indicator)
- **Anode (Long leg, +)**: Connect to **Pin 27** on the ESP32.
- **Cathode (Short leg, -)**: Connect to a **220Ω resistor**, and connect the other end of the resistor to the **GND** rail.

### 4. Active Buzzer (RAM/Storage Warning)
- **Positive Pin (+ / longer leg)**: Connect to **Pin 25** on the ESP32.
- **Negative Pin (- / shorter leg)**: Connect to the **GND** rail.

### 5. IR Sensor (To Silence Buzzer)
The IR sensor module usually has 3 pins: `VCC`, `GND`, and `OUT` / `DO`.
- **VCC**: Connect to the **VIN or 5V (Red +)** rail on the breadboard.
- **GND**: Connect to the **GND (Blue -)** rail.
- **OUT / DO**: Connect to **Pin 34** on the ESP32. *(Note: Pin 34 is an Input-Only pin, perfect for reading sensors).*

### 6. Servo Motor (Door / Vault Simulator)
The Servo Motor has a 3-wire cable (usually Brown, Red, and Orange/Yellow).
- **Brown Wire (GND)**: Connect to the **GND (Blue -)** rail.
- **Red Wire (VCC)**: Connect to the **VIN or 5V (Red +)** rail.
- **Orange/Yellow Wire (PWM Signal)**: Connect to **Pin 18** on the ESP32.

---

## 📝 Setup Checklist
- [ ] Are all grounds tied together on the breadboard?
- [ ] Is the Servo plugged into the 5V/VIN pin instead of the 3.3V pin to ensure it has enough power?
- [ ] Are the LEDs connected in the correct orientation (longer leg to the ESP32 pin)?
- [ ] Are your 220Ω resistors connected to the LEDs to protect them from burning out?

## 🚀 Final Steps
1. Double-check all wire connections against the list above.
2. Plug the ESP32 into your computer using a data-capable Micro-USB or USB-C cable.
3. Open `config.h` in the Arduino IDE and ensure your Wi-Fi credentials (`WIFI_SSID` & `WIFI_PASSWORD`) are correct.
4. Compile and upload `banking_monitor.ino` to the ESP32.
5. Open the Serial Monitor (**Baud rate: 115200**) to verify the connection and get your ESP32's assigned IP Address.
