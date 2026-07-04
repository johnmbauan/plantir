#pragma once

#include <ArduinoJson.h>
#include "StorageManager.h"

DynamicJsonDocument fetchRemoteConfig(const AppConfig& config);
void sendHumidityReading(float humidity, int deviceId, const AppConfig& config);
void sendBatteryReading(int deviceId, const AppConfig& config);
bool registerDevice(const String& token, const AppConfig& config);
void sendCalibrationReading(int rawValue, int deviceId, const AppConfig& config);
void clearCalibrationMode(int deviceId, const AppConfig& config);
void sendDeviceLog(const String& level, const String& message, const AppConfig& config);
