#include "StorageManager.h"
#include <Preferences.h>

AppConfig loadConfig() {
  Preferences preferences;
  preferences.begin("app", true);
  AppConfig appConfig;
  appConfig.serverUrl = preferences.getString("serverUrl", "");
  appConfig.apiKey = preferences.getString("apiKey", "");
  preferences.end();
  return appConfig;
}

void saveConfig(const AppConfig& appConfig) {
  Preferences preferences;
  preferences.begin("app", false);
  preferences.putString("serverUrl", appConfig.serverUrl);
  preferences.putString("apiKey", appConfig.apiKey);
  preferences.end();
}

void clearConfig() {
  Preferences preferences;
  preferences.begin("app", false);
  preferences.clear();
  preferences.end();
}

String loadPairingToken() {
  Preferences preferences;
  preferences.begin("app", true);
  const String pairingToken = preferences.getString("pairToken", "");
  preferences.end();
  return pairingToken;
}

void savePairingToken(const String& pairingToken) {
  Preferences preferences;
  preferences.begin("app", false);
  preferences.putString("pairToken", pairingToken);
  preferences.end();
}

void clearPairingToken() {
  Preferences preferences;
  preferences.begin("app", false);
  preferences.remove("pairToken");
  preferences.end();
}

bool registrationRestartUsed() {
  Preferences preferences;
  preferences.begin("app", true);
  const bool restartAlreadyUsed = preferences.getBool("regReset", false);
  preferences.end();
  return restartAlreadyUsed;
}

void markRegistrationRestartUsed() {
  Preferences preferences;
  preferences.begin("app", false);
  preferences.putBool("regReset", true);
  preferences.end();
}

void clearRegistrationRestartFlag() {
  Preferences preferences;
  preferences.begin("app", false);
  preferences.remove("regReset");
  preferences.end();
}
