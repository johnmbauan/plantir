#include "StorageManager.h"
#include <Preferences.h>

AppConfig loadConfig() {
  Preferences prefs;
  prefs.begin("app", true);
  AppConfig config;
  config.serverUrl = prefs.getString("serverUrl", "");
  config.apiKey    = prefs.getString("apiKey", "");
  prefs.end();
  return config;
}

void saveConfig(const AppConfig& config) {
  Preferences prefs;
  prefs.begin("app", false);
  prefs.putString("serverUrl", config.serverUrl);
  prefs.putString("apiKey",    config.apiKey);
  prefs.end();
}

void clearConfig() {
  Preferences prefs;
  prefs.begin("app", false);
  prefs.clear();
  prefs.end();
}

String loadPairingToken() {
  Preferences prefs;
  prefs.begin("app", true);
  const String token = prefs.getString("pairToken", "");
  prefs.end();
  return token;
}

void savePairingToken(const String& token) {
  Preferences prefs;
  prefs.begin("app", false);
  prefs.putString("pairToken", token);
  prefs.end();
}

void clearPairingToken() {
  Preferences prefs;
  prefs.begin("app", false);
  prefs.remove("pairToken");
  prefs.end();
}

bool registrationRestartUsed() {
  Preferences prefs;
  prefs.begin("app", true);
  const bool used = prefs.getBool("regReset", false);
  prefs.end();
  return used;
}

void markRegistrationRestartUsed() {
  Preferences prefs;
  prefs.begin("app", false);
  prefs.putBool("regReset", true);
  prefs.end();
}

void clearRegistrationRestartFlag() {
  Preferences prefs;
  prefs.begin("app", false);
  prefs.remove("regReset");
  prefs.end();
}
