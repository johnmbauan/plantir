#pragma once

#include <Arduino.h>
#include "StorageManager.h"

// Connects to WiFi via WiFiManager, handles factory reset, and parses any
// Plantir Setup bundle submitted through the captive portal.
//
// On return:
//   - config is populated (and persisted) with the server URL and API key.
//   - pairingToken is non-empty if a new pairing bundle was submitted.
//
// Returns false if WiFi failed to connect or credentials are missing.
bool connectAndProvision(AppConfig& config, String& pairingToken);

// Exposed for use as the WiFiManager reset callback.
void onPortalConfigReset();
