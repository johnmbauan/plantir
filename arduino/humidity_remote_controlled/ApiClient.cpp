#include "ApiClient.h"
#include "Config.h"
#include "DeviceIdentity.h"
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <BatteryUtils.h>

static WiFiClientSecure client;

// ── Retry helpers ─────────────────────────────────────────────────────────────
// Only connection failures (code < 0) and server errors (5xx) are retried;
// 4xx responses are permanent and returned immediately.

static int httpGet(const String& url, const String& apiKey, String& responseBody) {
  client.setInsecure();
  for (int attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
    HTTPClient http;
    http.begin(client, url);
    http.addHeader("apikey", apiKey);
    const int code = http.GET();
    if (code == HTTP_CODE_OK) responseBody = http.getString();
    http.end();
    if (code == HTTP_CODE_OK) return code;
    Serial.println("[" + String(attempt) + "/" + String(MAX_API_RETRIES) + "] GET failed: HTTP " + String(code));
    const bool shouldRetry = (code < 0 || code >= 500);
    if (!shouldRetry || attempt == MAX_API_RETRIES) return code;
    delay(RETRY_DELAY_MS);
  }
  return -1;
}

static int httpPost(const String& url, const String& apiKey, const String& body, String* response = nullptr) {
  client.setInsecure();
  for (int attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
    HTTPClient http;
    http.begin(client, url);
    http.addHeader("apikey", apiKey);
    http.addHeader("Content-Type", "application/json");
    const int code = http.POST(body);
    if (response) *response = http.getString();
    http.end();
    const bool shouldRetry = (code < 0 || code >= 500);
    if (!shouldRetry || attempt == MAX_API_RETRIES) return code;
    Serial.println("[" + String(attempt) + "/" + String(MAX_API_RETRIES) + "] POST failed: HTTP " + String(code));
    delay(RETRY_DELAY_MS);
  }
  return -1;
}

// ── Public API ────────────────────────────────────────────────────────────────

DynamicJsonDocument fetchRemoteConfig(const AppConfig& config) {
  const String url = config.serverUrl
    + "/rest/v1/humidity_sensors_config?select=*,devices!inner(*)&devices.serialNumber=eq."
    + getDeviceId();

  String body;
  const int code = httpGet(url, config.apiKey, body);
  Serial.println("fetchRemoteConfig: HTTP " + String(code));

  DynamicJsonDocument result(1024);
  if (code != HTTP_CODE_OK) return result; // isNull() == true — caller treats as fatal

  DynamicJsonDocument array(2048);
  deserializeJson(array, body);
  result.set(array[0]);
  return result;
}

void sendHumidityReading(float humidity, int deviceId, const AppConfig& config) {
  const String body = "{\"humidityPercentage\":" + String((int)humidity)
                    + ",\"deviceId\":"           + String(deviceId) + "}";
  const int code = httpPost(config.serverUrl + "/rest/v1/humidity_measurements", config.apiKey, body);
  if (code == HTTP_CODE_CREATED) {
    Serial.println("Humidity sent successfully ✅");
  } else {
    Serial.println("Failed to send humidity 😖. HTTP error: " + String(code));
  }
}

void sendBatteryReading(int deviceId, const AppConfig& config) {
  const uint32_t adcPinMv      = readBatteryAdcPinMilliVolts();
  const float    batteryVoltage = adcPinMv / 1000.0f * BATTERY_VOLTAGE_DIVIDER_RATIO;
  const int      batteryPct     = batteryPercentFromVoltage(batteryVoltage);
  Serial.println("Battery ADC pin: " + String(adcPinMv) + " mV → "
                 + String(batteryVoltage, 2) + " V → " + String(batteryPct) + "%");

  const String body = "{\"batteryPercent\":" + String(batteryPct)
                    + ",\"deviceId\":"        + String(deviceId) + "}";
  const int code = httpPost(config.serverUrl + "/rest/v1/battery_measurements", config.apiKey, body);
  if (code == HTTP_CODE_CREATED) {
    Serial.println("Battery sent successfully ✅");
  } else {
    Serial.println("Failed to send battery 😖. HTTP error: " + String(code));
  }
}

void sendCalibrationReading(int rawValue, int deviceId, const AppConfig& config) {
  const String body = "{\"rawValue\":" + String(rawValue)
                    + ",\"deviceId\":"  + String(deviceId) + "}";
  const int code = httpPost(config.serverUrl + "/rest/v1/calibration_readings", config.apiKey, body);
  if (code == HTTP_CODE_CREATED) {
    Serial.println("Calibration reading sent: " + String(rawValue));
  } else {
    Serial.println("Failed to send calibration reading. HTTP error: " + String(code));
  }
}

void clearCalibrationMode(int deviceId, const AppConfig& config) {
  const String body = "{\"p_device_id\":" + String(deviceId) + "}";
  const int code = httpPost(config.serverUrl + "/rest/v1/rpc/clear_calibration_mode", config.apiKey, body);
  if (code == HTTP_CODE_OK || code == HTTP_CODE_NO_CONTENT) {
    Serial.println("Calibration mode cleared ✅");
  } else {
    Serial.println("Failed to clear calibration mode. HTTP error: " + String(code));
  }
}

bool registerDevice(const String& token, const AppConfig& config) {
  const String body = "{\"token\":\"" + token + "\",\"serialNumber\":\"" + getDeviceId() + "\"}";
  String responseBody;
  const int code = httpPost(config.serverUrl + "/functions/v1/register-device", config.apiKey, body, &responseBody);
  Serial.println("Register device HTTP code: " + String(code));
  if (responseBody.length() > 0) Serial.println(responseBody);
  if (code == HTTP_CODE_OK) {
    Serial.println("Device registered successfully ✅");
    return true;
  }
  return false;
}

void sendDeviceLog(const String& level, const String& message, const AppConfig& config) {
  // Use ArduinoJson to build the body so special characters in message are escaped.
  DynamicJsonDocument doc(512);
  doc["serialNumber"] = getDeviceId();
  doc["level"]        = level;
  doc["message"]      = message;
  String body;
  serializeJson(doc, body);

  const int code = httpPost(config.serverUrl + "/rest/v1/device_logs", config.apiKey, body);
  if (code == HTTP_CODE_CREATED) {
    Serial.println("Device log sent ✅ [" + level + "] " + message);
  } else {
    Serial.println("Failed to send device log. HTTP error: " + String(code));
  }
}
