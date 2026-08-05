#pragma once

#include "StorageManager.h"

// Marks the current OTA image as valid so deep-sleep wakes do not roll it back.
void markFirmwareValid();

// Downloads firmwareBinaryUrl into the inactive OTA partition and restarts on success.
// On failure, logs and returns so the normal wake cycle can continue.
void downloadAndApplyFirmwareUpdate(const String& firmwareBinaryUrl, const AppConfig& appConfig);
