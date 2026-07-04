#include "Config.h"
#include "DeviceIdentity.h"
#include "StorageManager.h"
#include "WifiProvisioner.h"
#include "ApiClient.h"
#include "SensorRunner.h"
#include "CalibrationRunner.h"

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

  DynamicJsonDocument remoteConfig = fetchRemoteConfig(config);
  if (remoteConfig.isNull() || !remoteConfig.containsKey("deviceId")) {
    Serial.println("No remote configuration found for this device.");
    return;
  }

  const bool inCalibrationMode = !remoteConfig["calibrationModeStartedAt"].isNull();
  if (inCalibrationMode) {
    runCalibrationLoop(remoteConfig, config);
    // Clear the flag immediately so stale state can never re-trigger calibration
    // on the next wake, even if the web app fails to clear it.
    clearCalibrationMode(remoteConfig["deviceId"], config);
    // Give the user 60 seconds to place the device back in the soil before
    // taking the first real reading post-calibration.
    Serial.println("Calibration complete. Waiting 60 s for device to be re-planted...");
    delay(60000);
    // Re-fetch so checkHumidity uses the newly saved airValue/waterValue.
    remoteConfig = fetchRemoteConfig(config);
    if (remoteConfig.isNull() || !remoteConfig.containsKey("deviceId")) {
      Serial.println("Failed to re-fetch config after calibration.");
      return;
    }
  }

  // Always take a normal reading: first soil reading after calibration, or regular periodic reading.
  checkHumidity(remoteConfig, config);

  const int sleepDurationSeconds = remoteConfig["sleepDurationSeconds"] | DEFAULT_SLEEP_DURATION;
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
