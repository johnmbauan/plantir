#include "Config.h"
#include "DeviceIdentity.h"
#include "StorageManager.h"
#include "WifiProvisioner.h"
#include "ApiClient.h"
#include "SensorRunner.h"
#include "CalibrationRunner.h"

// FireBeetle 2 ESP32-C5/C6: LED_BUILTIN is GPIO15 (active HIGH per DFRobot examples).
static void blinkBootLed() {
  pinMode(LED_BUILTIN, OUTPUT);
  for (int i = 0; i < BOOT_LED_BLINK_COUNT; i++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(BOOT_LED_ON_MS);
    digitalWrite(LED_BUILTIN, LOW);
    delay(BOOT_LED_OFF_MS);
  }
}

static void bootLedOff() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
}

// Logs the reason to Serial (and to the server when config is available), powers
// off the sensor, and enters deep sleep for ERROR_SLEEP_SEC seconds.
// Marked [[noreturn]] so the compiler knows execution never continues past this call.
[[noreturn]] static void goToSleep(const String& reason, const AppConfig* config = nullptr) {
  Serial.println("[ERROR] " + reason);
  if (config != nullptr) {
    sendDeviceLog("error", reason, *config);
  }
  if (powerPin >= 0) digitalWrite(powerPin, LOW);
  bootLedOff();
  esp_sleep_enable_timer_wakeup((uint64_t)ERROR_SLEEP_SEC * uS_TO_S_FACTOR);
  Serial.flush();
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  blinkBootLed();

  // Power on the sensor via the 3V3_C switched supply (C5 only; C6 has an always-on 3V3 rail).
  if (powerPin >= 0) {
    pinMode(powerPin, OUTPUT);
    digitalWrite(powerPin, HIGH);
    delay(1000); // Waiting for the sensor to stabilize.
  }

  Serial.println("I'm starting.... ");
  Serial.println("Device ID: " + getDeviceId());

  AppConfig config;
  String pairingToken;
  if (!connectAndProvision(config, pairingToken)) {
    // No network — can't log remotely; just sleep and retry later.
    goToSleep("WiFi or provisioning failed.");
  }

  if (!pairingToken.isEmpty()) {
    if (!registerDevice(pairingToken, config)) {
      goToSleep("Device registration failed. Fix the setup and try again.", &config);
    }
  }

  DynamicJsonDocument remoteConfig = fetchRemoteConfig(config);
  if (remoteConfig.isNull() || !remoteConfig.containsKey("deviceId")) {
    goToSleep("No remote configuration found for this device.", &config);
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
      goToSleep("Failed to re-fetch config after calibration.", &config);
    }
  }

  // Always take a normal reading: first soil reading after calibration, or regular periodic reading.
  checkHumidity(remoteConfig, config);

  const int sleepDurationSeconds = remoteConfig["sleepDurationSeconds"] | DEFAULT_SLEEP_DURATION;
  Serial.println("Entering in deep sleep for " + String(sleepDurationSeconds) + " seconds... 😴");

  // Power off the sensor before sleeping to avoid draining the battery (C5 only).
  if (powerPin >= 0) digitalWrite(powerPin, LOW);
  bootLedOff();
  esp_sleep_enable_timer_wakeup(sleepDurationSeconds * uS_TO_S_FACTOR);
  Serial.flush();
  esp_deep_sleep_start();
}

void loop() {
  // Empty — device always sleeps at the end of setup() via deep sleep.
}
