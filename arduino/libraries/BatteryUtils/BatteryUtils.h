#ifndef BATTERY_UTILS_H
#define BATTERY_UTILS_H

#include <Arduino.h>
// https://dfimg.dfrobot.com/wiki/20190/DFR1222_firebeetle-2-esp32-c5_schematics_V1.0.pdf
// The FireBeetle 2 ESP32-C5 battery measurement circuit (from schematic DFR1222 V1.0):
//   - BAT_ADC = GPIO1 (IO1, module pin 7): ADC input, midpoint of the voltage divider
//   - CTRL    = GPIO0 (IO0, module pin 6): gate of Q5 (AO3400 N-ch MOSFET);
//              must be driven HIGH before reading and LOW after to save power
//   - Divider: R19=1MΩ, R20=1MΩ → ratio 2.0 (V_bat = V_adc × 2)
#define BAT_ADC_PIN  1
#define BAT_CTRL_PIN 0
#define BATTERY_VOLTAGE_DIVIDER_RATIO 2.0f
#define BATTERY_VOLTAGE_MIN 3.0f  // LiPo ~0%
#define BATTERY_VOLTAGE_MAX 4.2f  // LiPo ~100%

// Returns the battery voltage in volts (e.g. 3.7).
// Drives CTRL (GPIO0) HIGH to enable the measurement circuit, then LOW after reading.
// Uses analogReadMilliVolts() for ADC nonlinearity compensation via factory calibration.
inline float readBatteryVoltage() {
  pinMode(BAT_CTRL_PIN, OUTPUT);
  digitalWrite(BAT_CTRL_PIN, HIGH);
  delay(500);  // RC settle time: R19+R20=2MΩ, C18=100nF → τ=200ms, wait 2.5τ
  uint32_t mv = analogReadMilliVolts(BAT_ADC_PIN);
  digitalWrite(BAT_CTRL_PIN, LOW);
  return (mv / 1000.0f) * BATTERY_VOLTAGE_DIVIDER_RATIO;
}

// Returns the estimated battery charge level as a percentage (0-100).
inline int readBatteryPercent() {
  float voltage = readBatteryVoltage();
  int pct = (int)((voltage - BATTERY_VOLTAGE_MIN) / (BATTERY_VOLTAGE_MAX - BATTERY_VOLTAGE_MIN) * 100.0f);
  return constrain(pct, 0, 100);
}

#endif
