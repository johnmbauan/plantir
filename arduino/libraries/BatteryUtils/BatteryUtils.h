#ifndef BATTERY_UTILS_H
#define BATTERY_UTILS_H

#include <Arduino.h>

// ── Per-board battery circuit definitions ──────────────────────────────────────
//
// FireBeetle 2 ESP32-C5 (DFR1222 V1.0):
//   GPIO0 = CTRL: gate of Q5 (AO3400 N-ch MOSFET) — must be driven HIGH before
//           reading and LOW after to save power.
//   GPIO1 = BAT_ADC: midpoint of the R19=1MΩ / R20=1MΩ voltage divider.
//   Ref: https://dfimg.dfrobot.com/wiki/20190/DFR1222_firebeetle-2-esp32-c5_schematics_V1.0.pdf
//
// FireBeetle 2 ESP32-C6 (DFR1075):
//   GPIO0 = BAT_ADC: midpoint of the 1MΩ / 1MΩ divider, always connected — no
//           MOSFET gate needed.  Do NOT configure this pin as a digital output or
//           the ADC reading will be destroyed (typically reads ~3.3 V → 100%).
//   Ref: https://wiki.dfrobot.com/dfr1075/docs/17359

#if defined(CONFIG_IDF_TARGET_ESP32C5)
  #define BAT_ADC_PIN  1   // GPIO1 — ADC input on the C5
  #define BAT_CTRL_PIN 0   // GPIO0 — MOSFET gate on the C5
  #define BAT_HAS_CTRL_PIN 1
  #define BATTERY_ADC_SAMPLES 6
  #define BATTERY_ADC_SETTLE_MS 500
  #define BATTERY_ADC_SAMPLE_DELAY_MS 0
#elif defined(CONFIG_IDF_TARGET_ESP32C6)
  #define BAT_ADC_PIN  0   // GPIO0 — ADC input directly on the C6 (no gate pin)
  #define BAT_HAS_CTRL_PIN 0
  // High-impedance 1 MΩ divider + 100 nF cap: needs more samples and recovery time.
  #define BATTERY_ADC_SAMPLES 30
  #define BATTERY_ADC_SETTLE_MS 500
  #define BATTERY_ADC_SAMPLE_DELAY_MS 20
#else
  #error "BatteryUtils: unsupported target. Set board to FireBeetle 2 ESP32-C5 or ESP32-C6."
#endif

#define BATTERY_VOLTAGE_DIVIDER_RATIO 2.0f
#define BATTERY_VOLTAGE_MIN 3.0f  // LiPo protection cutoff (~0% SOC); device can run below 3.4 V in deep sleep
#define BATTERY_VOLTAGE_MAX 4.2f  // LiPo full charge

inline void initBatteryAdc() {
  static bool initialized = false;
  if (initialized) return;
  analogReadResolution(12);
#if defined(CONFIG_IDF_TARGET_ESP32C6)
  // GPIO0 must be an input for the divider to drive the ADC pin.  If any code
  // (e.g. a C5-style powerPin on GPIO0) left it as OUTPUT HIGH, readings peg at 100%.
  pinMode(BAT_ADC_PIN, INPUT);
  analogSetPinAttenuation(BAT_ADC_PIN, ADC_11db);
#endif
  initialized = true;
}

// Average ADC pin voltage in millivolts (before the 2× divider correction).
inline uint32_t readBatteryAdcPinMilliVolts() {
  initBatteryAdc();
#if BAT_HAS_CTRL_PIN
  pinMode(BAT_CTRL_PIN, OUTPUT);
  digitalWrite(BAT_CTRL_PIN, HIGH);
  delay(BATTERY_ADC_SETTLE_MS);
#else
  pinMode(BAT_ADC_PIN, INPUT);
  delay(BATTERY_ADC_SETTLE_MS);
#endif
  uint32_t mvSum = 0;
  for (int i = 0; i < BATTERY_ADC_SAMPLES; i++) {
    mvSum += analogReadMilliVolts(BAT_ADC_PIN);
    if (BATTERY_ADC_SAMPLE_DELAY_MS > 0) {
      delay(BATTERY_ADC_SAMPLE_DELAY_MS);
    }
  }
#if BAT_HAS_CTRL_PIN
  digitalWrite(BAT_CTRL_PIN, LOW);
#endif
  return mvSum / BATTERY_ADC_SAMPLES;
}

// Returns the battery voltage in volts (e.g. 3.7).
inline float readBatteryVoltage() {
  return readBatteryAdcPinMilliVolts() / 1000.0f * BATTERY_VOLTAGE_DIVIDER_RATIO;
}

// Returns the estimated battery charge level as a percentage (0-100).
inline int batteryPercentFromVoltage(float voltage) {
  int pct = (int)((voltage - BATTERY_VOLTAGE_MIN) / (BATTERY_VOLTAGE_MAX - BATTERY_VOLTAGE_MIN) * 100.0f);
  return constrain(pct, 0, 100);
}

inline int readBatteryPercent() {
  return batteryPercentFromVoltage(readBatteryVoltage());
}

#endif
