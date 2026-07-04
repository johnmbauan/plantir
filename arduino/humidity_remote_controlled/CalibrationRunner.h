#pragma once

#include <ArduinoJson.h>
#include "StorageManager.h"

// Runs the calibration loop for CALIBRATION_DURATION_MS milliseconds, posting
// a raw ADC average to calibration_readings every CALIBRATION_INTERVAL_MS.
// Returns when the loop is complete.
void runCalibrationLoop(const DynamicJsonDocument& config, const AppConfig& appConfig);
