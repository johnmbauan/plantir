#pragma once

#include <Arduino.h>

struct AppConfig {
  String serverUrl;
  String apiKey;
};

AppConfig loadConfig();
void saveConfig(const AppConfig& config);
void clearConfig();
