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
