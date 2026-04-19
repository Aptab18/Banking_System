/**
 * banking_monitor.ino — PhysiOps Banking System
 * ESP32 Hardware Monitor for GitHub Actions CI/CD
 *
 * Receives HTTP webhooks from GitHub Actions self-hosted runner and controls:
 *   - Green LED  → Build Successful
 *   - Red LED    → Build Failed
 *   - Buzzer     → RAM/Storage Warning (infinite loop detected)
 *   - IR Sensor  → Hand gesture to silence buzzer
 *
 * Endpoints:
 *   POST /webhook   {"status":"build_success"|"build_failed"|"ram_warning"}
 *   GET  /status    → returns current state as JSON (diagnostic)
 *   GET  /           → health check
 *
 * Libraries required (install via Arduino IDE Library Manager):
 *   - ArduinoJson  (by Benoit Blanchon, v6.x)
 *   - WebServer    (built-in ESP32 core)
 *   - WiFi         (built-in ESP32 core)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include "config.h"

// ── Global State ──────────────────────────────────────────────────────────────
WebServer server(HTTP_PORT);
Servo myServo;

String  currentStatus   = "idle";    // idle | build_success | build_failed | ram_warning
bool    buzzerActive    = false;
bool    blinkState      = false;
unsigned long lastBlink = 0;

// ── Helper: Set LEDs and Buzzer ───────────────────────────────────────────────
void clearAll() {
  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_RED_LED,   LOW);
  digitalWrite(PIN_BUZZER,    LOW);
  myServo.write(SERVO_IDLE_ANGLE);
  buzzerActive = false;
  blinkState   = false;
}

void setBuildSuccess() {
  clearAll();
  digitalWrite(PIN_GREEN_LED, HIGH);
  digitalWrite(PIN_RED_LED,   LOW);
  myServo.write(SERVO_SUCCESS_ANGLE);
  currentStatus = "build_success";
  Serial.println("[STATUS] Build Successful — Green LED ON, Servo Opened");
}

void setBuildFailed() {
  clearAll();
  digitalWrite(PIN_RED_LED,   HIGH);
  digitalWrite(PIN_GREEN_LED, LOW);
  currentStatus = "build_failed";
  Serial.println("[STATUS] Build Failed — Red LED ON");
}

void setRamWarning() {
  clearAll();
  buzzerActive  = true;
  currentStatus = "ram_warning";
  digitalWrite(PIN_BUZZER, HIGH);   // Start buzzer immediately
  Serial.println("[STATUS] RAM/Storage Warning — Buzzer ON, LEDs blinking");
}

// ── Helper: Forward to Local PC Dashboard ────────────────────────────────────
void forwardToDashboard(String status, String summary, String branch, String commit, float ramUsage = 0, String culprit = "None") {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://" + String(DASHBOARD_IP) + ":" + String(DASHBOARD_PORT) + "/api/ci-status";
    
    Serial.print("[RELAY] Forwarding to Dashboard: "); Serial.println(url);
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<512> doc;
    doc["status"]    = status;
    doc["branch"]    = branch;
    doc["commit"]    = commit;
    doc["summary"]   = summary;
    doc["ram_usage"] = ramUsage;
    doc["culprit"]   = culprit;
    
    String payload;
    serializeJson(doc, payload);
    
    int httpResponseCode = http.POST(payload);
    if (httpResponseCode > 0) {
      Serial.printf("[RELAY] Success, response code: %d\n", httpResponseCode);
    } else {
      Serial.printf("[RELAY] Error code: %d\n", httpResponseCode);
    }
    http.end();
  }
}

// ── HTTP Handler: POST /webhook ───────────────────────────────────────────────
void handleWebhook() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }

  String body = server.arg("plain");
  Serial.print("[WEBHOOK] Received: "); Serial.println(body);

  // Parse JSON
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }

  const char* status  = doc["status"];
  const char* branch  = doc["branch"]  | "unknown";
  const char* commit  = doc["commit"]  | "unknown";
  const char* summary = doc["summary"] | "No details provided";
  float ram_usage     = doc["ram_usage"] | 0;

  if (!status) {
    server.send(400, "application/json", "{\"error\":\"Missing 'status' field\"}");
    return;
  }

  // Apply status — mutually exclusive, only ONE at a time
  if (strcmp(status, "build_success") == 0) {
    setBuildSuccess();
  } else if (strcmp(status, "build_failed") == 0) {
    setBuildFailed();
  } else if (strcmp(status, "ram_warning") == 0) {
    setRamWarning();
  } else {
    server.send(400, "application/json", "{\"error\":\"Unknown status value\"}");
    return;
  }

  // Forward to Local Dashboard
  forwardToDashboard(status, summary, branch, commit, ram_usage);

  // Respond OK
  String resp = "{\"ok\":true,\"status\":\"" + currentStatus + "\"}";
  server.send(200, "application/json", resp);
}

// ── HTTP Handler: GET /status (diagnostic) ────────────────────────────────────
void handleStatus() {
  StaticJsonDocument<256> doc;
  doc["status"]      = currentStatus;
  doc["buzzerOn"]    = buzzerActive;
  doc["greenLed"]    = (digitalRead(PIN_GREEN_LED) == HIGH);
  doc["redLed"]      = (digitalRead(PIN_RED_LED)   == HIGH);
  doc["irTriggered"] = (digitalRead(PIN_IR_SENSOR) == IR_TRIGGERED_STATE);

  String resp;
  serializeJson(doc, resp);
  server.send(200, "application/json", resp);
}

// ── HTTP Handler: GET / (health check) ───────────────────────────────────────
void handleRoot() {
  server.send(200, "text/plain", "PhysiOps Banking Monitor v1.0 — OK");
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== PhysiOps Banking Monitor ===");

  // Pin modes
  pinMode(PIN_GREEN_LED,  OUTPUT);
  pinMode(PIN_RED_LED,    OUTPUT);
  pinMode(PIN_BUZZER,     OUTPUT);
  pinMode(PIN_IR_SENSOR,  INPUT);

  // Initialize Servo
  myServo.attach(PIN_SERVO);

  clearAll();

  // Startup visual: blink both LEDs briefly to confirm boot
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_GREEN_LED, HIGH);
    digitalWrite(PIN_RED_LED,   HIGH);
    delay(150);
    digitalWrite(PIN_GREEN_LED, LOW);
    digitalWrite(PIN_RED_LED,   LOW);
    delay(150);
  }

  // WiFi connect
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("[WiFi] Connected! IP address: ");
  Serial.println(WiFi.localIP());
  Serial.println(">>> Copy this IP into your GitHub Secret: ESP32_IP <<<");

  // HTTP routes
  server.on("/",        HTTP_GET,  handleRoot);
  server.on("/status",  HTTP_GET,  handleStatus);
  server.on("/webhook", HTTP_POST, handleWebhook);
  server.begin();

  Serial.printf("[HTTP] Server started on port %d\n", HTTP_PORT);
  Serial.println("[Ready] Waiting for GitHub Actions webhooks...\n");
}

// ── Loop ──────────────────────────────────────────────────────────────────────
void loop() {
  server.handleClient();

  // ── IR Sensor: silence buzzer when hand is detected ───────────────────────
  if (buzzerActive) {
    bool irDetected = (digitalRead(PIN_IR_SENSOR) == IR_TRIGGERED_STATE);
    if (irDetected) {
      digitalWrite(PIN_BUZZER,    LOW);
      digitalWrite(PIN_GREEN_LED, LOW);
      digitalWrite(PIN_RED_LED,   LOW);
      buzzerActive  = false;
      currentStatus = "idle";
      Serial.println("[IR] Hand detected — Buzzer silenced, status reset to idle");
    }

    // Blink both LEDs during ram_warning while buzzer is on
    unsigned long now = millis();
    if (now - lastBlink >= BLINK_INTERVAL_MS) {
      blinkState = !blinkState;
      digitalWrite(PIN_GREEN_LED, blinkState ? HIGH : LOW);
      digitalWrite(PIN_RED_LED,   blinkState ? LOW  : HIGH);  // Alternate blink
      lastBlink = now;
    }
  }
}
