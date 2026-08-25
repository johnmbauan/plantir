/*
 * Capacitivo soil moisture sensor baseline tester v1.2
 */

// Pin connected to the sensor "AUOUT" / "SIG" wire
const int sensorPin = A1;

// Analog pin used as a digital output to power the sensor
const int powerPin = A3;

// Calibration baselines (adjust after your own dry/wet tests)
const int airCalibrationValue = 590;   // Sensor reading in dry air
const int waterCalibrationValue = 280; // Sensor reading fully submerged in water

const int readsPerRun = 3;
const int readDelayMs = 1000;
const int sleepDurationSeconds = 10;
#define uS_TO_S_FACTOR 1000000ULL

void setup() {
  Serial.begin(9600);

  pinMode(powerPin, OUTPUT);
  digitalWrite(powerPin, HIGH);
  delay(1000); // Waiting for the sensor to stabilize.

  pinMode(sensorPin, INPUT);

  for (int readingIndex = 0; readingIndex < readsPerRun; readingIndex++) {
    const int rawAdcValue = analogRead(sensorPin);

    int soilMoisturePercent = map(rawAdcValue, airCalibrationValue, waterCalibrationValue, 0, 100);
    if (soilMoisturePercent > 100) soilMoisturePercent = 100;
    if (soilMoisturePercent < 0) soilMoisturePercent = 0;

    Serial.print("Raw: ");
    Serial.print(rawAdcValue);
    Serial.print(" | Moisture: ");
    Serial.print(soilMoisturePercent);
    Serial.println("%");

    delay(readDelayMs);
  }

  digitalWrite(powerPin, LOW);
  Serial.print("Entering deep sleep for ");
  Serial.print(sleepDurationSeconds);
  Serial.println(" seconds...");
  Serial.flush();
  esp_sleep_enable_timer_wakeup((uint64_t)sleepDurationSeconds * uS_TO_S_FACTOR);
  esp_deep_sleep_start();
}

void loop() {
  // Empty — device always sleeps at the end of setup() via deep sleep.
}
