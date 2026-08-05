/*
 * Capacitivo soil moisture sensor baseline tester v1.2
 */

// Pin connected to the sensor "AUOUT" / "SIG" wire
const int sensorPin = A2;

// Calibration baselines (adjust after your own dry/wet tests)
const int airCalibrationValue = 590;   // Sensor reading in dry air
const int waterCalibrationValue = 280; // Sensor reading fully submerged in water

void setup() {
  Serial.begin(9600);
  pinMode(sensorPin, INPUT);
}

void loop() {
  const int rawAdcValue = analogRead(sensorPin);

  // Map raw ADC into a moisture percentage (0%–100%)
  int soilMoisturePercent = map(rawAdcValue, airCalibrationValue, waterCalibrationValue, 0, 100);

  if (soilMoisturePercent > 100) soilMoisturePercent = 100;
  if (soilMoisturePercent < 0) soilMoisturePercent = 0;

  Serial.print("Raw: ");
  Serial.print(rawAdcValue);
  Serial.print(" | Moisture: ");
  Serial.print(soilMoisturePercent);
  Serial.println("%");

  delay(1000);
}
