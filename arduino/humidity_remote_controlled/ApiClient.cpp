#include "ApiClient.h"
#include "DeviceIdentity.h"
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <BatteryUtils.h>

static WiFiClientSecure client;

DynamicJsonDocument fetchRemoteConfig(const AppConfig& config) {
  DynamicJsonDocument array(2048);
  HTTPClient http;

  client.setInsecure();
  const String deviceId  = getDeviceId();
  const String url = config.serverUrl
    + "/rest/v1/humidity_sensors_config?select=*,devices!inner(*)&devices.serialNumber=eq."
    + deviceId;

  http.begin(client, url);
  http.addHeader("apikey", config.apiKey);
  const int httpCode = http.GET();

  Serial.println("HTTP code: " + String(httpCode) + " " + http.errorToString(httpCode));
  if (httpCode == HTTP_CODE_OK) {
    deserializeJson(array, http.getString());
  }
  http.end();

  DynamicJsonDocument result(1024);
  result.set(array[0]);
  return result;
}

void sendHumidityReading(float humidity, int deviceId, const AppConfig& config) {
  HTTPClient http;

  http.begin(client, config.serverUrl + "/rest/v1/humidity_measurements");
  http.addHeader("apikey", config.apiKey);
  http.addHeader("Content-Type", "application/json");

  const String body = "{\"humidityPercentage\":" + String((int)humidity)
                    + ",\"deviceId\":"           + String(deviceId) + "}";
  const int httpCode = http.POST(body);

  if (httpCode == HTTP_CODE_CREATED) {
    Serial.println("Humidity sent successfully ✅");
  } else {
    Serial.println("Failed to send humidity 😖. HTTP error: " + String(httpCode));
  }
  http.end();
}

void sendBatteryReading(int deviceId, const AppConfig& config) {
  HTTPClient http;

  http.begin(client, config.serverUrl + "/rest/v1/battery_measurements");
  http.addHeader("apikey", config.apiKey);
  http.addHeader("Content-Type", "application/json");

  const int   batteryPct     = readBatteryPercent();
  const float batteryVoltage = readBatteryVoltage();
  Serial.println("Battery: " + String(batteryPct) + "% (" + String(batteryVoltage, 2) + "V)");

  const String body = "{\"batteryPercent\":" + String(batteryPct)
                    + ",\"deviceId\":"        + String(deviceId) + "}";
  const int httpCode = http.POST(body);

  if (httpCode == HTTP_CODE_CREATED) {
    Serial.println("Battery sent successfully ✅");
  } else {
    Serial.println("Failed to send battery 😖. HTTP error: " + String(httpCode));
  }
  http.end();
}

bool registerDevice(const String& token, const AppConfig& config) {
  HTTPClient http;

  client.setInsecure();
  http.begin(client, config.serverUrl + "/functions/v1/register-device");
  http.addHeader("apikey", config.apiKey);
  http.addHeader("Content-Type", "application/json");

  const String serialNumber = getDeviceId();
  const String body = "{\"token\":\"" + token + "\",\"serialNumber\":\"" + serialNumber + "\"}";
  const int    httpCode    = http.POST(body);
  const String responseBody = http.getString();

  Serial.println("Register device HTTP code: " + String(httpCode));
  if (responseBody.length() > 0) {
    Serial.println(responseBody);
  }
  http.end();

  if (httpCode == HTTP_CODE_OK) {
    Serial.println("Device registered successfully ✅");
    return true;
  }
  return false;
}
