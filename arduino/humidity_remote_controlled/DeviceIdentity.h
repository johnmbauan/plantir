#pragma once

#include <Arduino.h>

inline String getDeviceId() {
  const uint64_t efuseMac = ESP.getEfuseMac();
  char deviceIdBuffer[17];
  snprintf(
    deviceIdBuffer,
    sizeof(deviceIdBuffer),
    "%04X%04X%08X",
    (uint16_t)(efuseMac >> 48),
    (uint16_t)(efuseMac >> 32),
    (uint32_t)efuseMac
  );
  return String(deviceIdBuffer);
}
