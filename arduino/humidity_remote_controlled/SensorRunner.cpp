#include "SensorRunner.h"
#include "ApiClient.h"
#include "Config.h"
#include <HumiditySensorUtils.h>

void measureAndSendHumidityReadings(
  const DynamicJsonDocument& deviceSyncPayload,
  const AppConfig& appConfig
) {
  const int airCalibrationValue = deviceSyncPayload["airValue"];
  const int waterCalibrationValue = deviceSyncPayload["waterValue"];

  if (airCalibrationValue == waterCalibrationValue) {
    Serial.println("Invalid sensor calibration values. Check the configuration.");
    return;
  }

  const int deviceId = deviceSyncPayload["deviceId"];
  const float averageHumidityPercent = readAvgHumidityPercent(
    sensorPin,
    airCalibrationValue,
    waterCalibrationValue,
    readsPerRun
  );

  sendHumidityReading(averageHumidityPercent, deviceId, appConfig);
  sendBatteryReading(deviceId, appConfig);
}
