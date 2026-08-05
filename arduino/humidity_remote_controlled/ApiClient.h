#pragma once

#include <ArduinoJson.h>
#include "StorageManager.h"

struct FirmwareTarget {
  bool valid = false;
  int version = 0;
  String binaryUrl;
  String source;
};

// Calls device_wake_sync: returns humidity config + desired firmware, and reports FIRMWARE_VERSION.
DynamicJsonDocument fetchDeviceSyncPayload(const AppConfig& appConfig);
FirmwareTarget firmwareTargetFromSyncPayload(const DynamicJsonDocument& deviceSyncPayload);

void sendHumidityReading(float humidityPercent, int deviceId, const AppConfig& appConfig);
void sendBatteryReading(int deviceId, const AppConfig& appConfig);
bool registerDevice(const String& pairingToken, const AppConfig& appConfig);
void sendCalibrationReading(int rawAdcValue, int deviceId, const AppConfig& appConfig);
void clearCalibrationMode(int deviceId, const AppConfig& appConfig);
void sendDeviceLog(const String& level, const String& message, const AppConfig& appConfig);
