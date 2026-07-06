import { describe, it, expect } from 'vitest'
import { defaultFormValues, formValuesFromDevice } from './utils'
import { buildDevice } from '@/test/builders/device'
import { DEFAULT_HUMIDITY_CONFIG } from '@/constants/deviceDefaults'

describe('defaultFormValues', () => {
  it('returns empty serial and default humidity config', () => {
    expect(defaultFormValues()).toEqual({
      serialNumber: '',
      plantId: null,
      type: 'humidity',
      humidityConfig: { ...DEFAULT_HUMIDITY_CONFIG },
    })
  })
})

describe('formValuesFromDevice', () => {
  it('maps device fields to form values', () => {
    const device = buildDevice()
    expect(formValuesFromDevice(device)).toEqual({
      serialNumber: 'SN-001',
      plantId: 10,
      type: 'humidity',
      humidityConfig: {
        minHumidityThreshold: DEFAULT_HUMIDITY_CONFIG.minHumidityThreshold,
        airValue: DEFAULT_HUMIDITY_CONFIG.airValue,
        waterValue: DEFAULT_HUMIDITY_CONFIG.waterValue,
        sleepDurationSeconds: DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds,
      },
    })
  })

  it('falls back to defaults when humidity config is missing', () => {
    const device = buildDevice({ humidityConfig: null })
    expect(formValuesFromDevice(device).humidityConfig).toEqual({ ...DEFAULT_HUMIDITY_CONFIG })
  })
})
