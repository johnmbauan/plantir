#ifndef HUMIDITY_SENSOR_UTILS_H
#define HUMIDITY_SENSOR_UTILS_H

inline int readAvgRawValue(const uint8_t sensorPin, const int samples = 5) {
  long total = 0;
  for (int i = 0; i < samples; i++) {
    total += analogRead(sensorPin);
    delay(250);
  }
  return total / samples;
}

inline int readAvgHumidityPercent(const uint8_t sensorPin, const int airValue, const int waterValue, const int samples = 5) {
  long totalValue = 0;

  for (int i = 0; i < samples; i++) {
    int sensorValue = analogRead(sensorPin);
    Serial.println("Sensor value: " + String(sensorValue));
    totalValue += sensorValue;
    delay(250);
  }

  int avgValue = totalValue / samples;
  int moisturePercent = map(avgValue, airValue, waterValue, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  Serial.println("airValue: " + String(airValue) + ", waterValue: " + String(waterValue));
  Serial.println("Average sensor value: " + String(avgValue) + ", Moisture percent: " + String(moisturePercent));

  return moisturePercent;
}

#endif
