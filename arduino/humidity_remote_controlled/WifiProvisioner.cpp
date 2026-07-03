#include "WifiProvisioner.h"
#include "Config.h"
#include "DeviceIdentity.h"
#include "StorageManager.h"
#include <WiFiManager.h>

static bool parsePlantirBundle(const String& bundle, String& url, String& apiKey, String& token) {
  const int first = bundle.indexOf(BUNDLE_DELIMITER);
  if (first < 0) return false;

  const int second = bundle.indexOf(BUNDLE_DELIMITER, first + 3);
  if (second < 0) return false;

  if (bundle.indexOf(BUNDLE_DELIMITER, second + 3) >= 0) return false;

  url    = bundle.substring(0, first);
  apiKey = bundle.substring(first + 3, second);
  token  = bundle.substring(second + 3);
  url.trim();
  apiKey.trim();
  token.trim();

  if (!url.startsWith("https://")) return false;

  return !url.isEmpty() && !apiKey.isEmpty() && !token.isEmpty();
}

static bool isFactoryResetRequested() {
  pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);
  if (digitalRead(BOOT_BUTTON_PIN) != LOW) return false;

  Serial.println("Hold BOOT for 3 seconds to factory reset...");
  const unsigned long holdStart = millis();
  while (millis() - holdStart < FACTORY_RESET_HOLD_MS) {
    if (digitalRead(BOOT_BUTTON_PIN) != LOW) return false;
    delay(100);
  }
  return true;
}

void onPortalConfigReset() {
  clearConfig();
}

bool connectAndProvision(AppConfig& config, String& pairingToken) {
  const bool factoryReset = isFactoryResetRequested();
  if (factoryReset) {
    Serial.println("Factory reset: clearing WiFi and Supabase credentials");
    clearConfig();
  }

  pairingToken = "";
  config = loadConfig();

  WiFiManager wm;
  wm.setConfigPortalTimeout(600);
  if (factoryReset) {
    wm.resetSettings();
  }
  wm.setConfigResetCallback(onPortalConfigReset);

  const String deviceSerial = getDeviceId();
  const String portalHead =
    "<style>.plantir-device-id{font-weight:600;margin:8px 0;word-break:break-all;}</style>"
    "<p class='plantir-device-id'>Device ID: " + deviceSerial + "</p>";
  wm.setCustomHeadElement(portalHead.c_str());

  WiFiManagerParameter paramBundle(
    "plantirBundle",
    "Plantir Setup (paste setup code from the web app)",
    "",
    PLANTIR_BUNDLE_MAX_LEN
  );
  wm.addParameter(&paramBundle);

  wm.autoConnect("Plantir-Device-Setup");

  const String bundle = String(paramBundle.getValue());
  if (!bundle.isEmpty()) {
    String parsedUrl, parsedKey, parsedToken;
    if (!parsePlantirBundle(bundle, parsedUrl, parsedKey, parsedToken)) {
      Serial.println("Invalid Plantir Setup code. Expected url###apiKey###token");
      return false;
    }
    config.serverUrl = parsedUrl;
    config.apiKey    = parsedKey;
    pairingToken     = parsedToken;
    saveConfig(config);
  } else if (config.serverUrl.isEmpty() || config.apiKey.isEmpty()) {
    Serial.println("Missing Supabase credentials. Paste the Plantir Setup code from the web app.");
    return false;
  }

  Serial.println("Saved server URL: " + config.serverUrl);
  Serial.println("Saved API Key length: " + String(config.apiKey.length()));

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Failed to connect to Wi-Fi 😭");
    return false;
  }

  Serial.println("Connected to Wi-Fi 😁!");
  return true;
}
