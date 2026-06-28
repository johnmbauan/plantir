#include <WifiUtils.h>
#include <HumiditySensorUtils.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>

// !!WARNING!! This sketch has not been tested with FireBeetle 2 ESP32-C5 and is very much outdated

const String plantName = "Pothos - Salone";
const String plantPicLink = "https://photos.app.goo.gl/hfw8fVBE2hGxkENx9";
#define TIME_TO_SLEEP  21600  // Tempo di riposo: 6 ore (6 * 60 * 60 secondi)
const int minHumidityThreshold = 10;

// --- Configurazione Wi-Fi e Telegram (Inserisci i tuoi dati) ---

#define BOTtoken "8618854061:AAE9grd1PBzL0U9IsYQD_XFvCT9G6oSb5RY"
#define CHAT_ID "-1003844603248"
const char* ssid = "wifi_ssid";
const char* password = "password";
WiFiClientSecure client;
UniversalTelegramBot bot(BOTtoken, client);

//const int powerPin = 14; // Pin opzionale per alimentare il sensore solo quando serve
const int sensorPin = A0;
const int airValue = 2540;
const int waterValue = 870;

#define uS_TO_S_FACTOR 1000000ULL  // Fattore di conversione da microsecondi a secondi

void setup() {
  Serial.begin(115200);
  client.setInsecure();

  // Configura il pin per alimentare il sensore (opzionale ma consigliato)
  //pinMode(powerPin, OUTPUT);
  //digitalWrite(powerPin, HIGH); // Accendi il sensore
  delay(500); // Aspetta che il sensore si stabilizzi

  checkHumidity();

  Serial.println("Entering in deep sleep...");
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  Serial.flush();

  // 4. Vai a dormire
  esp_deep_sleep_start();
}

void loop() {
  // Il loop rimarrà vuoto perché l'ESP32 si resetta dopo il sonno
}

void checkHumidity() {
  float avgHumidity = readAvgHumidityPercent(sensorPin, airValue, waterValue, 5);
  //digitalWrite(powerPin, LOW); // Spegni subito il sensore per risparmiare energia e corrosione

  // Logica di controllo Soglia (> 90%)
  if (avgHumidity < minHumidityThreshold) {
    bool isConnected = connectToWifi(ssid, password, "Humidity Sensor = " + WiFi.macAddress());
    if (isConnected) {
      String messaggio = "🪴 '" + plantName + "'  ha bisogno d'acqua!💦 \n";
      messaggio += "Umidità attuale: " + String(avgHumidity) + "% 🥀";
      if (bot.sendPhoto(CHAT_ID, plantPicLink , messaggio)) {
        Serial.println("Message sent to Telegram!");
      }
      else {
         Serial.println("Failed to send message to Telegram 😖");
      }
    }
  }
}
