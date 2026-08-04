#pragma once

#include <Arduino.h>

struct AppConfig {
  String serverUrl;
  String apiKey;
};

AppConfig loadConfig();
void saveConfig(const AppConfig& config);
void clearConfig();

// Pairing token is kept until the device successfully loads remote config
// (proving registration completed), so a failed first attempt can retry
// after deep-sleep / restart without re-running the captive portal.
String loadPairingToken();
void savePairingToken(const String& token);
void clearPairingToken();

// One-shot guard: after a failed post-portal registration we force ESP.restart()
// once to get a clean STA stack. The flag prevents reset loops.
bool registrationRestartUsed();
void markRegistrationRestartUsed();
void clearRegistrationRestartFlag();
