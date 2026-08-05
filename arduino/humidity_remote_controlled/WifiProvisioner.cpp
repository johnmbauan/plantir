#include "WifiProvisioner.h"
#include "Config.h"
#include "DeviceIdentity.h"
#include "StorageManager.h"
#include <WiFiManager.h>

// Accepts:
//   url###apiKey###token  — first-time pairing
//   url###apiKey          — reconnect for an already-registered device (no pairing)
static bool parsePlantirBundle(
  const String& setupBundle,
  String& serverUrl,
  String& apiKey,
  String& pairingToken
) {
  const int firstDelimiterIndex = setupBundle.indexOf(BUNDLE_DELIMITER);
  if (firstDelimiterIndex < 0) return false;

  const int secondDelimiterIndex = setupBundle.indexOf(BUNDLE_DELIMITER, firstDelimiterIndex + 3);
  const bool hasPairingToken = secondDelimiterIndex >= 0;

  if (hasPairingToken
      && setupBundle.indexOf(BUNDLE_DELIMITER, secondDelimiterIndex + 3) >= 0) {
    return false; // More than two delimiters
  }

  serverUrl = setupBundle.substring(0, firstDelimiterIndex);
  if (hasPairingToken) {
    apiKey = setupBundle.substring(firstDelimiterIndex + 3, secondDelimiterIndex);
    pairingToken = setupBundle.substring(secondDelimiterIndex + 3);
  } else {
    apiKey = setupBundle.substring(firstDelimiterIndex + 3);
    pairingToken = "";
  }
  serverUrl.trim();
  apiKey.trim();
  pairingToken.trim();

  if (!serverUrl.startsWith("https://")) return false;

  if (serverUrl.isEmpty() || apiKey.isEmpty()) return false;
  if (hasPairingToken && pairingToken.isEmpty()) return false;
  return true;
}

static bool isFactoryResetRequested() {
  pinMode(BOOT_BUTTON_PIN, INPUT_PULLUP);
  if (digitalRead(BOOT_BUTTON_PIN) != LOW) return false;

  Serial.println("Hold BOOT for 3 seconds to factory reset...");
  const unsigned long holdStartMs = millis();
  while (millis() - holdStartMs < FACTORY_RESET_HOLD_MS) {
    if (digitalRead(BOOT_BUTTON_PIN) != LOW) return false;
    delay(100);
  }
  return true;
}

void onPortalConfigReset() {
  clearConfig();
}

bool connectAndProvision(AppConfig& appConfig, String& pairingToken) {
  const bool factoryResetRequested = isFactoryResetRequested();
  if (factoryResetRequested) {
    Serial.println("Factory reset: clearing WiFi and Supabase credentials");
    clearConfig();
  }

  pairingToken = "";
  appConfig = loadConfig();

  WiFiManager wifiManager;
  wifiManager.setConfigPortalTimeout(600);
  wifiManager.setConnectTimeout(WIFI_CONNECT_TIMEOUT_SEC);
  if (factoryResetRequested) {
    wifiManager.resetSettings();
  }
  wifiManager.setConfigResetCallback(onPortalConfigReset);

  // Override WiFiManager's default blue theme with Plantir's green palette.
  // !important is required because WiFiManager appends its own <style> block
  // after this element in some library versions, so equal-specificity rules lose.
  const String deviceSerial = getDeviceId();
  const String portalHeadHtml = String(
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
  wifiManager.setCustomHeadElement(portalHeadHtml.c_str());

  WiFiManagerParameter setupBundleParameter(
    "plantirBundle",
    "Setup or reconnect code from Plants Center (setup for new devices; reconnect if already registered)",
    "",
    PLANTIR_BUNDLE_MAX_LEN
  );
  wifiManager.addParameter(&setupBundleParameter);

  wifiManager.autoConnect("Plantir-Device-Setup");

  const String setupBundle = String(setupBundleParameter.getValue());
  if (!setupBundle.isEmpty()) {
    String parsedServerUrl, parsedApiKey, parsedPairingToken;
    if (!parsePlantirBundle(setupBundle, parsedServerUrl, parsedApiKey, parsedPairingToken)) {
      Serial.println("Invalid Plantir code. Expected url###apiKey or url###apiKey###token");
      return false;
    }
    appConfig.serverUrl = parsedServerUrl;
    appConfig.apiKey = parsedApiKey;
    pairingToken = parsedPairingToken;
    saveConfig(appConfig);
    if (pairingToken.isEmpty()) {
      clearPairingToken();
    } else {
      savePairingToken(pairingToken);
    }
  } else if (appConfig.serverUrl.isEmpty() || appConfig.apiKey.isEmpty()) {
    Serial.println(
      "Missing Supabase credentials. Paste a setup or reconnect code from Plants Center."
    );
    return false;
  } else {
    // Resume an unfinished pairing after restart / deep sleep.
    pairingToken = loadPairingToken();
  }

  Serial.println("Saved server URL: " + appConfig.serverUrl);
  Serial.println("Saved API Key length: " + String(appConfig.apiKey.length()));

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Failed to connect to Wi-Fi 😭");
    return false;
  }

  Serial.println("Connected to Wi-Fi 😁!");
  return true;
}
