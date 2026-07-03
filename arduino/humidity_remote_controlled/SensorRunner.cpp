#include "SensorRunner.h"
#include "ApiClient.h"
#include "Config.h"
#include <HumiditySensorUtils.h>

void checkHumidity(const DynamicJsonDocument& config, const AppConfig& appConfig) {
  const int airValue   = config["airValue"];
  const int waterValue = config["waterValue"];

  if (airValue == waterValue) {
    Serial.println("Invalid sensor calibration values. Check the configuration.");
    return;
  }

  const int   minHumidityThreshold = config["minHumidityThreshold"] | 5; // Default to 5%
  const int   deviceId             = config["deviceId"];
  const float avgHumidity          = readAvgHumidityPercent(sensorPin, airValue, waterValue, readsPerRun);

  sendHumidityReading(avgHumidity, deviceId, appConfig);
  sendBatteryReading(deviceId, appConfig);
}
