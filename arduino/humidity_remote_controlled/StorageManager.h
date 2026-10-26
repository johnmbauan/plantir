#pragma once

#include <Arduino.h>

struct AppConfig {
  String serverUrl;
  String apiKey;
};

AppConfig loadConfig();
void saveConfig(const AppConfig& appConfig);
void clearConfig();

// Pairing token is kept until the device successfully loads remote config
// (proving registration completed), so a failed first attempt can retry
// after RESTART without re-running the captive portal.
String loadPairingToken();
void savePairingToken(const String& pairingToken);
void clearPairingToken();

// One-shot guard: after a failed post-portal registration we force ESP.restart()
// once to get a clean STA stack. The flag prevents reset loops.
bool registrationRestartUsed();
void markRegistrationRestartUsed();
void clearRegistrationRestartFlag();

// Last sleepDurationSeconds from a successful device_wake_sync. Used to arm
// the timer after an operational failure. Falls back to DEFAULT_SLEEP_DURATION.
void saveLastSleepDurationSeconds(int sleepDurationSeconds);
int loadLastSleepDurationSeconds();

// One short note saved when a failure cannot be posted (Wi-Fi down). Sent and
// cleared on the next wake that reaches the server.
void savePendingDeviceLog(const String& message);
String loadPendingDeviceLog();
void clearPendingDeviceLog();
