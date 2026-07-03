#pragma once

#include <Arduino.h>

inline String getDeviceId() {
  uint64_t mac = ESP.getEfuseMac();
  char id[17];
  snprintf(id, sizeof(id), "%04X%04X%08X",
           (uint16_t)(mac >> 48), (uint16_t)(mac >> 32), (uint32_t)mac);
  return String(id);
}
