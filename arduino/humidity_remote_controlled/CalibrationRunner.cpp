#include "CalibrationRunner.h"
#include "ApiClient.h"
#include "Config.h"
#include <HumiditySensorUtils.h>

static const unsigned long CALIBRATION_DURATION_MS = 120000UL; // 2 minutes
static const unsigned long CALIBRATION_INTERVAL_MS =  10000UL; // 10 seconds between readings

void runCalibrationLoop(
  const DynamicJsonDocument& deviceSyncPayload,
  const AppConfig& appConfig
) {
  const int deviceId = deviceSyncPayload["deviceId"];

  Serial.println(
    "Entering calibration mode for " + String(CALIBRATION_DURATION_MS / 1000) + " seconds..."
  );

  const unsigned long calibrationStartMs = millis();
  // Send immediately on first iteration.
  unsigned long lastReadingMs = calibrationStartMs - CALIBRATION_INTERVAL_MS;

  while (millis() - calibrationStartMs < CALIBRATION_DURATION_MS) {
    if (millis() - lastReadingMs >= CALIBRATION_INTERVAL_MS) {
      lastReadingMs = millis();
      const int rawAdcValue = readAvgRawValue(sensorPin);
      Serial.println("Calibration raw value: " + String(rawAdcValue));
      sendCalibrationReading(rawAdcValue, deviceId, appConfig);
    }
    delay(100);
  }

  Serial.println("Calibration loop complete.");
}
