#include <HumiditySensorUtils.h>
#include <BatteryUtils.h>
#include <WifiUtils.h>
#include <WiFiClientSecure.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>


#define DEFAULT_SLEEP_DURATION 21600  // 6 hours in seconds
#define uS_TO_S_FACTOR 1000000ULL     // Conversion factor for microseconds to seconds

// -- Remote server configuration ---
String remoteServerBaseUrl;
String supabaseApiKey;

WiFiClientSecure client;

//const int powerPin = 14; // Pin opzionale per alimentare il sensore solo quando serve
const int sensorPin = A1;  // GPIO2 (A1) on FireBeetle 2 ESP32-C5.
//const int sensorPin = 36; // GPIO36 (SVP) on ESP32 from DIYmore.
const int powerPin = 0;    // GPIO controlling the 3V3_C switched supply — verify against your board's schematic.
const int readsPerRun = 5; // Number of reads to make each time this program runs. The final result is the average of all the reads.

void setup() {
  Serial.begin(115200);

  // Power on the sensor via the 3V3_C switched supply
  pinMode(powerPin, OUTPUT);
  digitalWrite(powerPin, HIGH);
  delay(1000); // Waiting for the sensor to stabilize.

  Serial.println("I'm starting.... ");

  Serial.println("Device ID: " + getDeviceId());
  if (!connectToWifiAndCollectConfig()) {
    return;
  }

  const DynamicJsonDocument config = fetchRemoteConfig();
  checkHumidity(config);

  const int sleepDurationSeconds = config["sleepDurationSeconds"] | DEFAULT_SLEEP_DURATION; // Default to DEFAULT_SLEEP_DURATION if not specified in config

  Serial.println("Entering in deep sleep for " + String(sleepDurationSeconds) + " seconds... 😴");

  // Power off the sensor before sleeping to avoid draining the battery
  digitalWrite(powerPin, LOW);

  esp_sleep_enable_timer_wakeup(sleepDurationSeconds * uS_TO_S_FACTOR);
  Serial.flush();

  // Go to sleep
  esp_deep_sleep_start();
}

void loop() {
  // Empty, since it needs to sleep.
}

// read the configuration from a remote server through HTTPS and return the configuration object
DynamicJsonDocument fetchRemoteConfig() {
  DynamicJsonDocument array(2048);
  HTTPClient http;

  client.setInsecure();
  String deviceId = getDeviceId();
  String requestUrl = remoteServerBaseUrl + "/rest/v1/humidity_sensors_config?select=*,devices!inner(*)&devices.serialNumber=eq." + deviceId;
  http.begin(client, requestUrl);
  http.addHeader("apikey", supabaseApiKey);
  int httpCode = http.GET();

  Serial.println("HTTP code: " + String(httpCode) + " " + http.errorToString(httpCode));
  String responseBody = http.getString();
  if (httpCode == HTTP_CODE_OK) {
    deserializeJson(array, responseBody);
  }

  http.end();

  DynamicJsonDocument config(1024);
  config.set(array[0]);
  return config;
}

void sendHumidityReading(float humidity, int deviceId) {
  HTTPClient http;

  http.begin(client, remoteServerBaseUrl + "/rest/v1/humidity_measurements");
  http.addHeader("apikey", supabaseApiKey);
  http.addHeader("Content-Type", "application/json");

  String body = "{\"humidityPercentage\":" + String((int)humidity) + ",\"deviceId\":" + String(deviceId) + "}";
  int httpCode = http.POST(body);

  if (httpCode == HTTP_CODE_CREATED) {
    Serial.println("Humidity sent successfully ✅");
  } else {
    Serial.println("Failed to send humidity 😖. HTTP error: " + String(httpCode));
  }

  http.end();
}

void sendBatteryReading(int deviceId) {
  HTTPClient http;

  int batteryPct = readBatteryPercent();
  float batteryVoltage = readBatteryVoltage();
  Serial.println("Battery: " + String(batteryPct) + "% (" + String(batteryVoltage, 2) + "V)");

  http.begin(client, remoteServerBaseUrl + "/rest/v1/battery_measurements");
  http.addHeader("apikey", supabaseApiKey);
  http.addHeader("Content-Type", "application/json");

  String body = "{\"batteryPercent\":" + String(batteryPct) + ",\"deviceId\":" + String(deviceId) + "}";
  int httpCode = http.POST(body);

  if (httpCode == HTTP_CODE_CREATED) {
    Serial.println("Battery sent successfully ✅");
  } else {
    Serial.println("Failed to send battery 😖. HTTP error: " + String(httpCode));
  }

  http.end();
}

void checkHumidity(const DynamicJsonDocument& config) {
  int minHumidityThreshold = config["minHumidityThreshold"] | 5; // Default to 5%
  int airValue = config["airValue"];
  int waterValue = config["waterValue"];

  if (airValue == waterValue) {
    Serial.println("Invalid sensor calibration values. Check the configuration.");
    return;
  }

  int deviceId = config["deviceId"];
  float avgHumidity = readAvgHumidityPercent(sensorPin, airValue, waterValue, readsPerRun);
  sendHumidityReading(avgHumidity, deviceId);
  sendBatteryReading(deviceId);
}

String getDeviceId() {
  uint64_t mac = ESP.getEfuseMac();
  char id[17];
  snprintf(id, sizeof(id), "%04X%04X%08X",
           (uint16_t)(mac >> 48), (uint16_t)(mac >> 32), (uint32_t)mac);
  return String(id);
}

bool connectToWifiAndCollectConfig() {
  Preferences prefs;
  prefs.begin("app", false);

  remoteServerBaseUrl = prefs.getString("serverUrl", "");
  supabaseApiKey = prefs.getString("apiKey", "");

  WiFiManager wm;
  wm.setConfigPortalTimeout(600);

  // The last parameter (250) is only the HTML input field max length, not a storage buffer
  WiFiManagerParameter paramUrl("serverUrl", "Supabase URL", remoteServerBaseUrl.c_str(), 250);
  WiFiManagerParameter paramKey("apiKey", "Supabase API Key", supabaseApiKey.c_str(), 250);
  wm.addParameter(&paramUrl);
  wm.addParameter(&paramKey);

  wm.autoConnect("HumiditySensor-Setup");

  String newUrl = String(paramUrl.getValue());
  String newKey = String(paramKey.getValue());

  if (!newUrl.isEmpty()) {
    remoteServerBaseUrl = newUrl;
    prefs.putString("serverUrl", remoteServerBaseUrl);
  }

  if (!newKey.isEmpty()) {
    supabaseApiKey = newKey;
    prefs.putString("apiKey", supabaseApiKey);
  }

  Serial.println("Saved server URL: " + remoteServerBaseUrl);
  Serial.println("Saved API Key length: " + String(supabaseApiKey.length()));

  prefs.end();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Failed to connect to Wi-Fi 😭");
    return false;
  }

  Serial.println("Connected to Wi-Fi 😁!");
  return true;
}
