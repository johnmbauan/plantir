#pragma once

#include <Arduino.h>
#include "StorageManager.h"

// Connects to WiFi via WiFiManager, handles factory reset, and parses any
// Plantir Setup bundle submitted through the captive portal.
//
// On success:
//   - appConfig is populated (and persisted) with the server URL and API key.
//   - pairingToken is non-empty if a new pairing bundle was submitted, or if
//     a previous unpaired token is still stored for retry after RESTART.
//
// Returns false if WiFi failed to connect or credentials are missing. Caller
// should deep-sleep until RESTART rather than auto-retrying.
bool connectAndProvision(AppConfig& appConfig, String& pairingToken);

// Exposed for use as the WiFiManager reset callback.
void onPortalConfigReset();
