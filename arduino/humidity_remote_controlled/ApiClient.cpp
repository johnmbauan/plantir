#include "ApiClient.h"
#include "Config.h"
#include "DeviceIdentity.h"
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <BatteryUtils.h>

static WiFiClientSecure secureWifiClient;

// ── Retry helpers ─────────────────────────────────────────────────────────────
// Only connection failures (code < 0) and server errors (5xx) are retried;
// 4xx responses are permanent and returned immediately.

// Kept for future GET endpoints (device sync currently uses POST only).
[[maybe_unused]] static int httpGet(
  const String& url,
  const String& apiKey,
  String& responseBody
) {
  secureWifiClient.setInsecure();
  for (int attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
    HTTPClient httpClient;
    httpClient.begin(secureWifiClient, url);
    httpClient.addHeader("apikey", apiKey);
    const int httpStatusCode = httpClient.GET();
    if (httpStatusCode == HTTP_CODE_OK) responseBody = httpClient.getString();
    httpClient.end();
    if (httpStatusCode == HTTP_CODE_OK) return httpStatusCode;
    Serial.println(
      "[" + String(attempt) + "/" + String(MAX_API_RETRIES) + "] GET failed: HTTP "
      + String(httpStatusCode)
    );
    const bool shouldRetry = (httpStatusCode < 0 || httpStatusCode >= 500);
    if (!shouldRetry || attempt == MAX_API_RETRIES) return httpStatusCode;
    delay(RETRY_DELAY_MS);
  }
  return -1;
}

static int httpPost(
  const String& url,
  const String& apiKey,
  const String& requestBody,
  String* responseBody = nullptr
) {
  secureWifiClient.setInsecure();
  for (int attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
    HTTPClient httpClient;
    httpClient.begin(secureWifiClient, url);
    httpClient.addHeader("apikey", apiKey);
    httpClient.addHeader("Content-Type", "application/json");
    const int httpStatusCode = httpClient.POST(requestBody);
    if (responseBody) *responseBody = httpClient.getString();
    httpClient.end();
    const bool shouldRetry = (httpStatusCode < 0 || httpStatusCode >= 500);
    if (!shouldRetry || attempt == MAX_API_RETRIES) return httpStatusCode;
    Serial.println(
      "[" + String(attempt) + "/" + String(MAX_API_RETRIES) + "] POST failed: HTTP "
      + String(httpStatusCode)
    );
    delay(RETRY_DELAY_MS);
  }
  return -1;
}

// ── Public API ────────────────────────────────────────────────────────────────

DynamicJsonDocument fetchDeviceSyncPayload(const AppConfig& appConfig) {
  DynamicJsonDocument requestJson(256);
  requestJson["p_serial"] = getDeviceId();
  requestJson["p_board"] = FIRMWARE_BOARD;
  requestJson["p_firmware_version"] = FIRMWARE_VERSION;
  String requestBody;
  serializeJson(requestJson, requestBody);

  String responseBody;
  const int httpStatusCode = httpPost(
    appConfig.serverUrl + "/rest/v1/rpc/device_wake_sync",
    appConfig.apiKey,
    requestBody,
    &responseBody
  );
  Serial.println("fetchDeviceSyncPayload: HTTP " + String(httpStatusCode));

  DynamicJsonDocument deviceSyncPayload(1536);
  if (httpStatusCode != HTTP_CODE_OK || responseBody.length() == 0 || responseBody == "null") {
    return deviceSyncPayload; // isNull() / missing deviceId — caller treats as fatal
  }

  if (deserializeJson(deviceSyncPayload, responseBody) || deviceSyncPayload.isNull()) {
    DynamicJsonDocument emptyPayload(16);
    return emptyPayload;
  }
  return deviceSyncPayload;
}

FirmwareTarget firmwareTargetFromSyncPayload(const DynamicJsonDocument& deviceSyncPayload) {
  FirmwareTarget firmwareTarget;
  if (deviceSyncPayload["firmware"].isNull()
      || !deviceSyncPayload["firmware"].containsKey("version")) {
    return firmwareTarget;
  }
  const JsonVariantConst firmwareJson = deviceSyncPayload["firmware"];
  firmwareTarget.valid = true;
  firmwareTarget.version = firmwareJson["version"] | 0;
  firmwareTarget.binaryUrl = firmwareJson["binary_url"] | "";
  firmwareTarget.source = firmwareJson["source"] | "";
  Serial.println(
    "Firmware target: v" + String(firmwareTarget.version)
    + " (" + firmwareTarget.source + ") " + firmwareTarget.binaryUrl
  );
  return firmwareTarget;
}

void sendHumidityReading(float humidityPercent, int deviceId, const AppConfig& appConfig) {
  const String requestBody = "{\"humidityPercentage\":" + String((int)humidityPercent)
                           + ",\"deviceId\":"           + String(deviceId) + "}";
  const int httpStatusCode = httpPost(
    appConfig.serverUrl + "/rest/v1/humidity_measurements",
    appConfig.apiKey,
    requestBody
  );
  if (httpStatusCode == HTTP_CODE_CREATED) {
    Serial.println("Humidity sent successfully ✅");
  } else {
    Serial.println("Failed to send humidity 😖. HTTP error: " + String(httpStatusCode));
  }
}

void sendBatteryReading(int deviceId, const AppConfig& appConfig) {
  const uint32_t adcPinMilliVolts = readBatteryAdcPinMilliVolts();
  const float batteryVoltage = adcPinMilliVolts / 1000.0f * BATTERY_VOLTAGE_DIVIDER_RATIO;
  const int batteryPercent = batteryPercentFromVoltage(batteryVoltage);
  Serial.println("Battery ADC pin: " + String(adcPinMilliVolts) + " mV → "
                 + String(batteryVoltage, 2) + " V → " + String(batteryPercent) + "%");

  const String requestBody = "{\"batteryPercent\":" + String(batteryPercent)
                           + ",\"deviceId\":"        + String(deviceId) + "}";
  const int httpStatusCode = httpPost(
    appConfig.serverUrl + "/rest/v1/battery_measurements",
    appConfig.apiKey,
    requestBody
  );
  if (httpStatusCode == HTTP_CODE_CREATED) {
    Serial.println("Battery sent successfully ✅");
  } else {
    Serial.println("Failed to send battery 😖. HTTP error: " + String(httpStatusCode));
  }
}

void sendCalibrationReading(int rawAdcValue, int deviceId, const AppConfig& appConfig) {
  const String requestBody = "{\"rawValue\":" + String(rawAdcValue)
                           + ",\"deviceId\":"  + String(deviceId) + "}";
  const int httpStatusCode = httpPost(
    appConfig.serverUrl + "/rest/v1/calibration_readings",
    appConfig.apiKey,
    requestBody
  );
  if (httpStatusCode == HTTP_CODE_CREATED) {
    Serial.println("Calibration reading sent: " + String(rawAdcValue));
  } else {
    Serial.println("Failed to send calibration reading. HTTP error: " + String(httpStatusCode));
  }
}

void clearCalibrationMode(int deviceId, const AppConfig& appConfig) {
  const String requestBody = "{\"p_device_id\":" + String(deviceId) + "}";
  const int httpStatusCode = httpPost(
    appConfig.serverUrl + "/rest/v1/rpc/clear_calibration_mode",
    appConfig.apiKey,
    requestBody
  );
  if (httpStatusCode == HTTP_CODE_OK || httpStatusCode == HTTP_CODE_NO_CONTENT) {
    Serial.println("Calibration mode cleared ✅");
  } else {
    Serial.println("Failed to clear calibration mode. HTTP error: " + String(httpStatusCode));
  }
}

bool registerDevice(const String& pairingToken, const AppConfig& appConfig) {
  const String requestBody =
    "{\"token\":\"" + pairingToken + "\",\"serialNumber\":\"" + getDeviceId() + "\"}";
  String responseBody;
  const int httpStatusCode = httpPost(
    appConfig.serverUrl + "/functions/v1/register-device",
    appConfig.apiKey,
    requestBody,
    &responseBody
  );
  Serial.println("Register device HTTP code: " + String(httpStatusCode));
  if (responseBody.length() > 0) Serial.println(responseBody);
  if (httpStatusCode == HTTP_CODE_OK) {
    Serial.println("Device registered successfully ✅");
    return true;
  }
  return false;
}

void sendDeviceLog(const String& level, const String& message, const AppConfig& appConfig) {
  // Use ArduinoJson so special characters in message are escaped.
  DynamicJsonDocument logPayloadJson(512);
  logPayloadJson["serialNumber"] = getDeviceId();
  logPayloadJson["level"] = level;
  logPayloadJson["message"] = message;
  String requestBody;
  serializeJson(logPayloadJson, requestBody);

  const int httpStatusCode = httpPost(
    appConfig.serverUrl + "/rest/v1/device_logs",
    appConfig.apiKey,
    requestBody
  );
  if (httpStatusCode == HTTP_CODE_CREATED) {
    Serial.println("Device log sent ✅ [" + level + "] " + message);
  } else {
    Serial.println("Failed to send device log. HTTP error: " + String(httpStatusCode));
  }
}
