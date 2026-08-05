#include <WifiUtils.h>
#include <HumiditySensorUtils.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>

// !!WARNING!! This sketch has not been tested with FireBeetle 2 ESP32-C5 and is very much outdated

const String plantName = "Pothos - Salone";
const String plantPhotoUrl = "https://photos.app.goo.gl/hfw8fVBE2hGxkENx9";
#define TIME_TO_SLEEP  21600  // Deep sleep duration: 6 hours (6 * 60 * 60 seconds)
const int minHumidityThreshold = 10;

// --- Wi-Fi and Telegram configuration ---

#define BOTtoken "8618854061:AAE9grd1PBzL0U9IsYQD_XFvCT9G6oSb5RY"
#define CHAT_ID "-1003844603248"
const char* wifiSsid = "wifi_ssid";
const char* wifiPassword = "password";
WiFiClientSecure secureWifiClient;
UniversalTelegramBot telegramBot(BOTtoken, secureWifiClient);

//const int powerPin = 14; // Optional pin to power the sensor only when needed
const int sensorPin = A0;
const int airCalibrationValue = 2540;
const int waterCalibrationValue = 870;

#define uS_TO_S_FACTOR 1000000ULL  // Microseconds → seconds

void measureAndSendLowHumidityAlert();

void setup() {
  Serial.begin(115200);
  secureWifiClient.setInsecure();

  // Optional: power the sensor only for the reading window
  //pinMode(powerPin, OUTPUT);
  //digitalWrite(powerPin, HIGH);
  delay(500); // Wait for the sensor to stabilize

  measureAndSendLowHumidityAlert();

  Serial.println("Entering in deep sleep...");
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  Serial.flush();

  esp_deep_sleep_start();
}

void loop() {
  // Empty — device resets after deep sleep
}

void measureAndSendLowHumidityAlert() {
  const float averageHumidityPercent = readAvgHumidityPercent(
    sensorPin,
    airCalibrationValue,
    waterCalibrationValue,
    5
  );
  //digitalWrite(powerPin, LOW); // Power off immediately to save energy and reduce corrosion

  if (averageHumidityPercent < minHumidityThreshold) {
    const bool wifiConnected = connectToWifi(
      wifiSsid,
      wifiPassword,
      "Humidity Sensor = " + WiFi.macAddress()
    );
    if (wifiConnected) {
      String telegramMessage = "🪴 '" + plantName + "' needs water!💦 \n";
      telegramMessage += "Current humidity: " + String(averageHumidityPercent) + "% 🥀";
      if (telegramBot.sendPhoto(CHAT_ID, plantPhotoUrl, telegramMessage)) {
        Serial.println("Message sent to Telegram!");
      } else {
        Serial.println("Failed to send message to Telegram 😖");
      }
    }
  }
}
