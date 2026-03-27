#ifndef HUMIDITY_SENSOR_UTILS_H
#define HUMIDITY_SENSOR_UTILS_H


int readAvgHumidityPercent(const uint8_t sensorPin, const int airValue, const int waterValue, const int samples = 5) {
  long totalValue = 0;

  for (int i = 0; i < samples; i++) {
    totalValue += analogRead(sensorPin);
    delay(500); // Short delay between samples
  }

  int avgValue = totalValue / samples;
  int moisturePercent = map(avgValue, airValue, waterValue, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  return moisturePercent;
}

#endif
