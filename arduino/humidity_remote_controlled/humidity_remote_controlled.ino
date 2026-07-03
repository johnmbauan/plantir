#include "Config.h"
#include "DeviceIdentity.h"
#include "StorageManager.h"
#include "WifiProvisioner.h"
#include "ApiClient.h"
#include "SensorRunner.h"

void setup() {
  Serial.begin(115200);

  // Power on the sensor via the 3V3_C switched supply.
  pinMode(powerPin, OUTPUT);
  digitalWrite(powerPin, HIGH);
  delay(1000); // Waiting for the sensor to stabilize.

  Serial.println("I'm starting.... ");
  Serial.println("Device ID: " + getDeviceId());

  AppConfig config;
  String pairingToken;
  if (!connectAndProvision(config, pairingToken)) {
    return;
  }

  if (!pairingToken.isEmpty()) {
    if (!registerDevice(pairingToken, config)) {
      Serial.println("Device registration failed. Fix the setup code and try again.");
      return;
    }
  }

  const DynamicJsonDocument remoteConfig = fetchRemoteConfig(config);
  if (remoteConfig.isNull() || !remoteConfig.containsKey("deviceId")) {
    Serial.println("No remote configuration found for this device.");
    return;
  }

  checkHumidity(remoteConfig, config);

  const int sleepDurationSeconds = remoteConfig["sleepDurationSeconds"] | DEFAULT_SLEEP_DURATION; // Default to DEFAULT_SLEEP_DURATION if not specified in config
  Serial.println("Entering in deep sleep for " + String(sleepDurationSeconds) + " seconds... 😴");

  // Power off the sensor before sleeping to avoid draining the battery.
  digitalWrite(powerPin, LOW);
  esp_sleep_enable_timer_wakeup(sleepDurationSeconds * uS_TO_S_FACTOR);
  Serial.flush();
  esp_deep_sleep_start();
}

void loop() {
  // Empty — device sleeps between runs via deep sleep.
}
