#include "CalibrationRunner.h"
#include "ApiClient.h"
#include "Config.h"
#include <HumiditySensorUtils.h>

static const unsigned long CALIBRATION_DURATION_MS = 120000UL; // 2 minutes
static const unsigned long CALIBRATION_INTERVAL_MS =  10000UL; // 10 seconds between readings

void runCalibrationLoop(const DynamicJsonDocument& config, const AppConfig& appConfig) {
  const int deviceId = config["deviceId"];

  Serial.println("Entering calibration mode for " + String(CALIBRATION_DURATION_MS / 1000) + " seconds...");

  const unsigned long startMs = millis();
  unsigned long lastReadMs    = startMs - CALIBRATION_INTERVAL_MS; // send immediately on first iteration

  while (millis() - startMs < CALIBRATION_DURATION_MS) {
    if (millis() - lastReadMs >= CALIBRATION_INTERVAL_MS) {
      lastReadMs = millis();
      const int rawValue = readAvgRawValue(sensorPin);
      Serial.println("Calibration raw value: " + String(rawValue));
      sendCalibrationReading(rawValue, deviceId, appConfig);
    }
    delay(100);
  }

  Serial.println("Calibration loop complete.");
}
