#ifndef HUMIDITY_SENSOR_UTILS_H
#define HUMIDITY_SENSOR_UTILS_H

#include <Arduino.h>

static const int DEFAULT_HUMIDITY_SAMPLES = 6;
static const int MAX_HUMIDITY_SAMPLES = 16;
static const int HUMIDITY_SAMPLE_DELAY_MS = 500;

// A sample is an outlier when it is farther from the median than both 3× the
// typical spread (median absolute deviation) and 5% of the median. The 5% floor
// stops normal analog-to-digital jitter from being treated as an outlier when
// the other samples are tightly clustered.
static const int OUTLIER_MAD_MULTIPLIER = 3;
static const int OUTLIER_MEDIAN_PERCENT_FLOOR = 5;

inline int clampedHumiditySampleCount(const int sampleCount) {
  if (sampleCount < 1) return 1;
  if (sampleCount > MAX_HUMIDITY_SAMPLES) return MAX_HUMIDITY_SAMPLES;
  return sampleCount;
}

inline void sortIntsAscending(int* values, const int count) {
  for (int i = 0; i < count - 1; i++) {
    for (int j = i + 1; j < count; j++) {
      if (values[j] < values[i]) {
        const int swapValue = values[i];
        values[i] = values[j];
        values[j] = swapValue;
      }
    }
  }
}

inline int medianOfSortedInts(const int* sortedValues, const int count) {
  if (count % 2 == 1) {
    return sortedValues[count / 2];
  }
  return (sortedValues[count / 2 - 1] + sortedValues[count / 2]) / 2;
}

inline int absoluteDifference(const int left, const int right) {
  return left >= right ? left - right : right - left;
}

inline int averageRawSamplesWithoutOutliers(const int* samples, const int sampleCount) {
  if (sampleCount <= 0) return 0;
  if (sampleCount == 1) return samples[0];

  int sortedSamples[MAX_HUMIDITY_SAMPLES];
  for (int sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    sortedSamples[sampleIndex] = samples[sampleIndex];
  }
  sortIntsAscending(sortedSamples, sampleCount);
  const int median = medianOfSortedInts(sortedSamples, sampleCount);

  int absoluteDeviations[MAX_HUMIDITY_SAMPLES];
  for (int sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    absoluteDeviations[sampleIndex] = absoluteDifference(samples[sampleIndex], median);
  }
  sortIntsAscending(absoluteDeviations, sampleCount);
  const int medianAbsoluteDeviation = medianOfSortedInts(absoluteDeviations, sampleCount);

  int obviousDeviationFloor = (median * OUTLIER_MEDIAN_PERCENT_FLOOR) / 100;
  if (obviousDeviationFloor < 1) {
    obviousDeviationFloor = 1;
  }
  const int madLimit = OUTLIER_MAD_MULTIPLIER * medianAbsoluteDeviation;
  const int deviationLimit = madLimit > obviousDeviationFloor
    ? madLimit
    : obviousDeviationFloor;

  long keptSum = 0;
  int keptCount = 0;
  for (int sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    const int sample = samples[sampleIndex];
    if (absoluteDifference(sample, median) > deviationLimit) {
      Serial.println("Discarded outlier: " + String(sample));
      continue;
    }
    keptSum += sample;
    keptCount++;
  }

  if (keptCount == 0) {
    return median;
  }

  Serial.println(
    "Averaging " + String(keptCount) + " of " + String(sampleCount) + " samples"
  );
  return keptSum / keptCount;
}

inline void readHumiditySamples(
  const uint8_t sensorPin,
  int* samples,
  const int sampleCount,
  const bool logEachSample
) {
  for (int sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    samples[sampleIndex] = analogRead(sensorPin);
    if (logEachSample) {
      Serial.println("Sensor value: " + String(samples[sampleIndex]));
    }
    delay(HUMIDITY_SAMPLE_DELAY_MS);
  }
}

inline int readAvgRawValue(
  const uint8_t sensorPin,
  const int sampleCount = DEFAULT_HUMIDITY_SAMPLES
) {
  const int clampedSampleCount = clampedHumiditySampleCount(sampleCount);
  int samples[MAX_HUMIDITY_SAMPLES];
  readHumiditySamples(sensorPin, samples, clampedSampleCount, false);
  return averageRawSamplesWithoutOutliers(samples, clampedSampleCount);
}

inline int readAvgHumidityPercent(
  const uint8_t sensorPin,
  const int airCalibrationValue,
  const int waterCalibrationValue,
  const int sampleCount = DEFAULT_HUMIDITY_SAMPLES
) {
  const int clampedSampleCount = clampedHumiditySampleCount(sampleCount);
  int samples[MAX_HUMIDITY_SAMPLES];
  readHumiditySamples(sensorPin, samples, clampedSampleCount, true);

  const int averageRawValue = averageRawSamplesWithoutOutliers(
    samples,
    clampedSampleCount
  );
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
