#include "Config.h"
#include "DeviceIdentity.h"
#include "StorageManager.h"
#include "WifiProvisioner.h"
#include "ApiClient.h"
#include "OtaUpdater.h"
#include "SensorRunner.h"
#include "CalibrationRunner.h"

#if defined(CONFIG_IDF_TARGET_ESP32C6)
#include "driver/gpio.h"
#endif

// FireBeetle 2 ESP32-C5/C6: LED_BUILTIN is GPIO15 (active HIGH per DFRobot examples).
static void blinkBootLed() {
  pinMode(LED_BUILTIN, OUTPUT);
  for (int blinkIndex = 0; blinkIndex < BOOT_LED_BLINK_COUNT; blinkIndex++) {
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

// Drive the sensor supply pin LOW. On the C6 the pad would otherwise float in
// deep sleep; gpio_hold_en latches that LOW until the next wake.
static void cutSensorPower() {
  if (powerPin < 0) return;
  digitalWrite(powerPin, LOW);
#if defined(CONFIG_IDF_TARGET_ESP32C6)
  gpio_hold_en((gpio_num_t)powerPin);
#endif
}

// Logs the reason to Serial (and to the server when config is available), powers
// off the sensor, and enters deep sleep for ERROR_SLEEP_SEC seconds.
// Marked [[noreturn]] so the compiler knows execution never continues past this call.
[[noreturn]] static void goToSleep(const String& reason, const AppConfig* appConfig = nullptr) {
  Serial.println("[ERROR] " + reason);
  if (appConfig != nullptr) {
    sendDeviceLog("error", reason, *appConfig);
  }
  cutSensorPower();
  bootLedOff();
  esp_sleep_enable_timer_wakeup((uint64_t)ERROR_SLEEP_SEC * uS_TO_S_FACTOR);
  Serial.flush();
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  blinkBootLed();

  // Power on the sensor: C5 uses GPIO0 to gate 3V3_C; C6 uses A3 because the 3.3 V rail
  // stays on in deep sleep, so the sensor VCC is wired to A3 instead of 3V3.
  if (powerPin >= 0) {
    pinMode(powerPin, OUTPUT);
    digitalWrite(powerPin, HIGH);
#if defined(CONFIG_IDF_TARGET_ESP32C6)
    // Release the deep-sleep latch after the pin is already driven HIGH so it
    // does not drop to the default input level on wake.
    gpio_hold_dis((gpio_num_t)powerPin);
#endif
    delay(1000); // Waiting for the sensor to stabilize.
  }

  Serial.println("I'm starting.... ");
  Serial.println("Device ID: " + getDeviceId());

  AppConfig appConfig;
  String pairingToken;
  if (!connectAndProvision(appConfig, pairingToken)) {
    // No network — can't log remotely; just sleep and retry later.
    goToSleep("WiFi or provisioning failed.");
  }

  auto deviceSyncPayloadLooksValid = [](const DynamicJsonDocument& deviceSyncPayload) {
    return !deviceSyncPayload.isNull() && deviceSyncPayload.containsKey("deviceId");
  };

  if (!pairingToken.isEmpty()) {
    registerDevice(pairingToken, appConfig);
  }

  // One RPC: humidity config + firmware target + report local FIRMWARE_VERSION.
  DynamicJsonDocument deviceSyncPayload = fetchDeviceSyncPayload(appConfig);
  if (!deviceSyncPayloadLooksValid(deviceSyncPayload)) {
    // Post-portal DNS/network is often broken; one clean STA reboot usually
    // fixes it. Only restart once so a persistent failure cannot loop.
    if (!pairingToken.isEmpty() && !registrationRestartUsed()) {
      markRegistrationRestartUsed();
      Serial.println("Registration incomplete — restarting once for clean WiFi...");
      Serial.flush();
      delay(200);
      ESP.restart();
    }

    // Keep pairing token so a later deep-sleep wake can still retry.
    goToSleep(
      pairingToken.isEmpty()
        ? "No remote configuration found for this device."
        : "Device not registered yet. Will retry after sleep.",
      &appConfig
    );
  }

  // Registration confirmed — clear pairing state.
  clearPairingToken();
  clearRegistrationRestartFlag();

  // Confirm the running image before deep sleep so OTA rollback does not undo it.
  markFirmwareValid();

  const FirmwareTarget firmwareTarget = firmwareTargetFromSyncPayload(deviceSyncPayload);
  if (firmwareTarget.valid
      && firmwareTarget.version != FIRMWARE_VERSION
      && firmwareTarget.binaryUrl.length() > 0) {
    Serial.println(
      "Firmware update available: local v" + String(FIRMWARE_VERSION)
      + " → remote v" + String(firmwareTarget.version)
    );
    downloadAndApplyFirmwareUpdate(firmwareTarget.binaryUrl, appConfig);
    // On success downloadAndApplyFirmwareUpdate restarts and never returns.
  }

  const bool inCalibrationMode = !deviceSyncPayload["calibrationModeStartedAt"].isNull();
  if (inCalibrationMode) {
    runCalibrationLoop(deviceSyncPayload, appConfig);
    // Clear the flag immediately so stale state can never re-trigger calibration
    // on the next wake, even if the web app fails to clear it.
    clearCalibrationMode(deviceSyncPayload["deviceId"], appConfig);
    // Give the user 2 minutes to place the device back in the soil before
    // taking the first real reading post-calibration.
    Serial.println("Calibration complete. Waiting 2 mins for device to be re-planted...");
    delay(120000);
    // Re-sync so measureAndSendHumidityReadings uses the newly saved airValue/waterValue.
    deviceSyncPayload = fetchDeviceSyncPayload(appConfig);
    if (!deviceSyncPayloadLooksValid(deviceSyncPayload)) {
      goToSleep("Failed to re-fetch config after calibration.", &appConfig);
    }
  }

  // Always take a normal reading: first soil reading after calibration, or regular periodic reading.
  measureAndSendHumidityReadings(deviceSyncPayload, appConfig);

  const int sleepDurationSeconds = deviceSyncPayload["sleepDurationSeconds"] | DEFAULT_SLEEP_DURATION;
  Serial.println("Entering in deep sleep for " + String(sleepDurationSeconds) + " seconds... 😴");

  // Power off the sensor before sleeping to avoid draining the battery.
  cutSensorPower();
  bootLedOff();
  esp_sleep_enable_timer_wakeup(sleepDurationSeconds * uS_TO_S_FACTOR);
  Serial.flush();
  esp_deep_sleep_start();
}

void loop() {
  // Empty — device always sleeps at the end of setup() via deep sleep.
}
