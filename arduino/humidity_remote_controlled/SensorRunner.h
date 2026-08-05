#pragma once

#include <ArduinoJson.h>
#include "StorageManager.h"

void measureAndSendHumidityReadings(
  const DynamicJsonDocument& deviceSyncPayload,
  const AppConfig& appConfig
);
