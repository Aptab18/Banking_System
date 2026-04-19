/**
 * config.h — PhysiOps Banking Monitor
 * ESP32 Hardware Configuration
 *
 * EDIT THESE VALUES before uploading to your ESP32:
 *   1. Set your WiFi SSID and password
 *   2. After first boot, note the IP shown in Serial Monitor
 *   3. Add that IP as GitHub Secret: ESP32_IP
 */

#ifndef CONFIG_H
#define CONFIG_H

// ── WiFi Credentials ──────────────────────────────────────────────────────────
#define WIFI_SSID     "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// ── GPIO Pin Assignments ──────────────────────────────────────────────────────
//
//  Component         ESP32 Pin    Notes
//  ─────────────     ─────────    ───────────────────────────────────────────
#define PIN_GREEN_LED   26        // Green LED (220Ω resistor to GND)
#define PIN_RED_LED     27        // Red LED   (220Ω resistor to GND)
#define PIN_BUZZER      25        // Active buzzer (+ to pin, - to GND)
#define PIN_IR_SENSOR   34        // IR sensor digital OUT (INPUT only on GPIO34)
#define PIN_SERVO       18        // Servo motor PWM signal pin

// ── Server Config ─────────────────────────────────────────────────────────────
#define HTTP_PORT       80        // ESP32 HTTP server port

// ── Dashboard Forwarding Config (Local PC) ────────────────────────────────────
#define DASHBOARD_IP    "192.168.10.3" // Local PC IP
#define DASHBOARD_PORT  3001           // Dashboard Backend Port

// ── Component Behavior ────────────────────────────────────────────────────────
// IR sensor silences buzzer when output goes LOW (object/hand detected)
// Most IR sensors: LOW = object detected, HIGH = no object
#define IR_TRIGGERED_STATE  LOW

// Servo configurations
#define SERVO_IDLE_ANGLE    0     // Default/Failed position (e.g. gate closed)
#define SERVO_SUCCESS_ANGLE 90    // Success position (e.g. gate open)

// ── LED Blink config for ram_warning ─────────────────────────────────────────
#define BLINK_INTERVAL_MS   300   // ms between blink toggles during RAM warning

#endif // CONFIG_H
