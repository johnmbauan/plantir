#ifndef HUMIDITY_SENSOR_UTILS_H
#define HUMIDITY_SENSOR_UTILS_H

inline int readAvgRawValue(const uint8_t sensorPin, const int sampleCount = 5) {
  long rawValueSum = 0;
  for (int sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    rawValueSum += analogRead(sensorPin);
    delay(250);
  }
  return rawValueSum / sampleCount;
}

inline int readAvgHumidityPercent(
  const uint8_t sensorPin,
  const int airCalibrationValue,
  const int waterCalibrationValue,
  const int sampleCount = 5
) {
  long rawValueSum = 0;

  for (int sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    const int rawSensorValue = analogRead(sensorPin);
    Serial.println("Sensor value: " + String(rawSensorValue));
    rawValueSum += rawSensorValue;
    delay(250);
  }

  const int averageRawValue = rawValueSum / sampleCount;
  int moisturePercent = map(averageRawValue, airCalibrationValue, waterCalibrationValue, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  Serial.println(
    "airValue: " + String(airCalibrationValue)
    + ", waterValue: " + String(waterCalibrationValue)
  );
  Serial.println(
    "Average sensor value: " + String(averageRawValue)
    + ", Moisture percent: " + String(moisturePercent)
  );

  return moisturePercent;
}

#endif
