#pragma once

#include <Arduino.h>
#include "Config.h"

// FireBeetle 2 ESP32-C5/C6: LED_BUILTIN is GPIO15 (active HIGH per DFRobot examples).
inline void blinkBuiltInLed(const int blinkCount) {
  pinMode(LED_BUILTIN, OUTPUT);
  for (int blinkIndex = 0; blinkIndex < blinkCount; blinkIndex++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(BOOT_LED_ON_MS);
    digitalWrite(LED_BUILTIN, LOW);
    delay(BOOT_LED_OFF_MS);
  }
}

inline void bootLedOff() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
}
