#include "OtaUpdater.h"
#include "ApiClient.h"
#include "Config.h"
#include <WiFiClientSecure.h>
#include <HTTPUpdate.h>
#include <esp_ota_ops.h>

void markFirmwareValid() {
  const esp_err_t markValidError = esp_ota_mark_app_valid_cancel_rollback();
  if (markValidError == ESP_OK) {
    Serial.println("Firmware marked valid (rollback cancelled).");
  } else {
    // Not fatal: older boots / non-rollback partitions may return an error.
    Serial.println("mark_app_valid: " + String(esp_err_to_name(markValidError)));
  }
}

void downloadAndApplyFirmwareUpdate(const String& firmwareBinaryUrl, const AppConfig& appConfig) {
  Serial.println("Starting HTTPS OTA from: " + firmwareBinaryUrl);

  WiFiClientSecure secureWifiClient;
  secureWifiClient.setInsecure();
  secureWifiClient.setTimeout(OTA_HTTP_TIMEOUT_MS);

  httpUpdate.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  httpUpdate.rebootOnUpdate(false);

  const t_httpUpdate_return updateResult = httpUpdate.update(secureWifiClient, firmwareBinaryUrl);
  switch (updateResult) {
    case HTTP_UPDATE_OK:
      Serial.println("OTA write succeeded. Restarting...");
      Serial.flush();
      delay(200);
      ESP.restart();
      break;
    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("OTA: no updates available.");
      break;
    case HTTP_UPDATE_FAILED:
    default:
      Serial.println(
        "OTA failed (" + String(httpUpdate.getLastError()) + "): "
        + httpUpdate.getLastErrorString()
      );
      sendDeviceLog(
        "error",
        "OTA failed: " + httpUpdate.getLastErrorString(),
        appConfig
      );
      break;
  }
}
