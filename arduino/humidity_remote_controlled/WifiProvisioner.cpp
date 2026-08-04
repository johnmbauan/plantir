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
  wm.setConnectTimeout(WIFI_CONNECT_TIMEOUT_SEC);
  if (factoryReset) {
    wm.resetSettings();
  }
  wm.setConfigResetCallback(onPortalConfigReset);

  // Override WiFiManager's default blue theme with Plantir's green palette.
  // !important is required because WiFiManager appends its own <style> block
  // after this element in some library versions, so equal-specificity rules lose.
  const String deviceSerial = getDeviceId();
  const String portalHead = String(
    "<style>"
    "body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif !important;"
         "background:#f2f7f2 !important;color:#1c3320 !important}"
    ".c{background:#fff !important;border-radius:12px !important;"
        "box-shadow:0 2px 16px rgba(0,40,0,.12) !important;max-width:340px !important}"
    "h1{color:#1b5e20 !important;font-size:1.2em !important;font-weight:700 !important;"
        "margin:0 0 2px !important}"
    "h3{color:#aaa !important;font-size:.72em !important;font-weight:400 !important;"
        "text-transform:uppercase !important;letter-spacing:.05em !important;margin:0 0 16px !important}"
    "hr{border:none !important;border-top:1px solid #e8f5e9 !important;margin:14px 0 !important}"
    ".button,a.button{background:#2e7d32 !important;border-radius:8px !important;"
        "color:#fff !important;font-weight:600 !important;font-size:.95em !important;"
        "border:none !important;transition:opacity .15s !important}"
    ".button:hover,.button:active,a.button:hover,a.button:active{background:#1b5e20 !important}"
    ".button.S{background:#1b5e20 !important}"
    "input[type=text],input[type=password],textarea{"
        "border:1.5px solid #c8e6c9 !important;border-radius:8px !important;"
        "box-sizing:border-box !important;font-size:.95em !important;"
        "padding:10px 12px !important;width:100% !important;outline:none !important}"
    "input[type=text]:focus,input[type=password]:focus,textarea:focus{"
        "border-color:#2e7d32 !important;box-shadow:0 0 0 2px rgba(46,125,50,.15) !important}"
    "label{color:#2e5c2e !important;font-weight:600 !important;font-size:.82em !important}"
    "a{color:#2e7d32 !important}"
    ".plantir-header{text-align:center;padding:4px 0 12px}"
    ".plantir-header b{color:#1b5e20;font-size:1.3em;letter-spacing:-.01em}"
    ".plantir-header small{display:block;color:#888;font-size:.72em;margin-top:2px}"
    ".plantir-id{background:#f0f9f0;border:1px solid #c8e6c9;border-radius:8px;"
                "padding:10px 12px;margin-bottom:12px;font-size:.8em}"
    ".plantir-id span{color:#666}"
    ".plantir-id b{display:block;color:#1b5e20;word-break:break-all;margin-top:2px}"
    "</style>"
    "<div class='plantir-header'><b>Plantir</b><small>Device Setup</small></div>"
    "<div class='plantir-id'><span>Device ID</span><b>") + deviceSerial + "</b></div>";
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
    savePairingToken(pairingToken);
  } else if (config.serverUrl.isEmpty() || config.apiKey.isEmpty()) {
    Serial.println("Missing Supabase credentials. Paste the Plantir Setup code from the web app.");
    return false;
  } else {
    // Resume an unfinished pairing after restart / deep sleep.
    pairingToken = loadPairingToken();
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
