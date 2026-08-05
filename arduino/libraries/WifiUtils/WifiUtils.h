#ifndef WIFI_UTILS_H
#define WIFI_UTILS_H

#include <WiFi.h>
#include <WiFiManager.h>

inline bool isConnectedToWifi() {
  return WiFi.status() == WL_CONNECTED;
}

// Connect to Wi-Fi using the provided SSID and password.
inline bool connectToWifi(
  const String& wifiSsid,
  const String& wifiPassword,
  const String& deviceHostname = "ESP32-Sensore"
) {
  Serial.println("Attempting to connect to " + wifiSsid + " as " + deviceHostname);
  WiFi.setHostname(deviceHostname.c_str());
  WiFi.begin(wifiSsid.c_str(), wifiPassword.c_str());

  int connectAttemptCount = 0;
  const int maxConnectAttempts = 20;

  while (!isConnectedToWifi() && connectAttemptCount < maxConnectAttempts) {
    delay(1000);
    Serial.print(".");
    connectAttemptCount++;
  }

  Serial.println(""); // new line
  if (!isConnectedToWifi()) {
    Serial.println("Wi-FI connection failed 😞");
    return false;
  }

  Serial.print("Connected to Wi-FI 😁!");
  return true;
}

/**
 * @brief Connect to Wi-Fi using WiFiManager.
 * This function will attempt to connect to Wi-Fi using saved credentials.
 * If it fails, it will create a temporary access point with the given name, allowing the user to
 * connect and configure Wi-Fi credentials through a web interface.
 * Note: There is a timeout of 600 seconds (10 minutes) for the configuration portal,
 * after which it will stop trying to connect and return false.
 *
 * @param hotspotName The name of the temporary access point to create if connection fails.
 * @return true if connected to Wi-Fi successfully.
 * @return false if failed to connect to Wi-Fi.
 */
inline bool connectToWifiManager(const String& hotspotName) {
  WiFiManager wifiManager;
  wifiManager.setConfigPortalTimeout(600);
  wifiManager.autoConnect(hotspotName.c_str());

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Failed to connect to Wi-Fi 😭");
    return false;
  }

  Serial.println("Connected to Wi-Fi 😁!");
  return true;
}

#endif
