#pragma once

// Increment this version when you make changes that require a new firmware update. See docs/firmware-releases.md
#define FIRMWARE_VERSION       4

#define DEFAULT_SLEEP_DURATION 21600  // 6 hours in seconds
#define uS_TO_S_FACTOR         1000000ULL
#define MAX_API_RETRIES        3
#define RETRY_DELAY_MS         2000
#define OTA_HTTP_TIMEOUT_MS    120000 // HTTPS firmware download timeout

#if defined(CONFIG_IDF_TARGET_ESP32C5)
  #define BOOT_BUTTON_PIN      28     // GPIO28 — BOOT button on FireBeetle 2 ESP32-C5
  #define FIRMWARE_BOARD       "esp32c5"
#elif defined(CONFIG_IDF_TARGET_ESP32C6)
  #define BOOT_BUTTON_PIN      9      // GPIO9  — BOOT button on FireBeetle 2 ESP32-C6
  #define FIRMWARE_BOARD       "esp32c6"
#else
  #error "Unsupported target: set the board to FireBeetle 2 ESP32-C5 or ESP32-C6 in Arduino IDE."
#endif
#define FACTORY_RESET_HOLD_MS  3000
#define WIFI_CONNECT_TIMEOUT_SEC 30  // STA join timeout during portal save / autoconnect
#define PLANTIR_BUNDLE_MAX_LEN 1024
#define BUNDLE_DELIMITER       "###"
#define BOOT_LED_BLINK_COUNT           3
#define FACTORY_RESET_LED_BLINK_COUNT  2
#define BOOT_LED_ON_MS                 150
#define BOOT_LED_OFF_MS                150

//const int sensorPin = 36;  // GPIO36 (SVP) on ESP32 from DIYmore.
const int sensorPin   = A1;  // Maps to GPIO2 on ESP32-C5; Arduino resolves the alias per board.

// On the FireBeetle 2 ESP32-C5, GPIO0 gates a MOSFET (Q5) that controls the 3V3_C switched
// supply powering the moisture sensor. Pulling it LOW during deep sleep eliminates sensor
// quiescent current.
// On the FireBeetle 2 ESP32-C6, the 3.3 V rail stays on in deep sleep (HM6245 LDO /
// TPS62A02), so the sensor VCC is wired to A3 instead. Drive A3 HIGH to power the
// sensor and LOW before sleep. GPIO0 on the C6 is the battery ADC pin and must
// never be driven as a digital output.
#if defined(CONFIG_IDF_TARGET_ESP32C5)
  const int powerPin = 0;
#elif defined(CONFIG_IDF_TARGET_ESP32C6)
  const int powerPin = A3;
#endif

const int readsPerRun = 5;   // Number of reads per run; the final result is their average.
