#pragma once

#define DEFAULT_SLEEP_DURATION 21600  // 6 hours in seconds
#define uS_TO_S_FACTOR         1000000ULL
#if defined(CONFIG_IDF_TARGET_ESP32C5)
  #define BOOT_BUTTON_PIN      28     // GPIO28 — BOOT button on FireBeetle 2 ESP32-C5
#elif defined(CONFIG_IDF_TARGET_ESP32C6)
  #define BOOT_BUTTON_PIN      9      // GPIO9  — BOOT button on FireBeetle 2 ESP32-C6
#else
  #error "Unsupported target: set the board to FireBeetle 2 ESP32-C5 or ESP32-C6 in Arduino IDE."
#endif
#define FACTORY_RESET_HOLD_MS  3000
#define PLANTIR_BUNDLE_MAX_LEN 1024
#define BUNDLE_DELIMITER       "###"

//const int sensorPin = 36;  // GPIO36 (SVP) on ESP32 from DIYmore.
const int sensorPin   = A1;  // GPIO2 (A1) on FireBeetle 2 ESP32-C5

//const int powerPin = 14;   // Optional pin to power the sensor only when needed.
const int powerPin    = 0;   // GPIO controlling the 3V3_C switched supply — verify against your board's schematic.

const int readsPerRun = 5;   // Number of reads per run; the final result is their average.
