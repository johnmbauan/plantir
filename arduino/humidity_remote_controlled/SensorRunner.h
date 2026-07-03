#pragma once

#include <ArduinoJson.h>
#include "StorageManager.h"

void checkHumidity(const DynamicJsonDocument& config, const AppConfig& appConfig);
