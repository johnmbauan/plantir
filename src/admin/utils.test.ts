import { describe, it, expect } from 'vitest'
import { humidityColor, batteryColor, LOG_LEVEL_COLOR } from './utils'

describe('humidityColor', () => {
  it.each([
    [null, 'dimmed'],
    [60, 'green'],
    [50, 'green'],
    [30, 'yellow'],
    [10, 'red'],
  ] as const)('returns %s for %s%% humidity', (pct, expected) => {
    expect(humidityColor(pct)).toBe(expected)
  })
})

describe('batteryColor', () => {
  it.each([
    [null, 'dimmed'],
    [80, 'green'],
    [50, 'green'],
    [25, 'yellow'],
    [10, 'red'],
  ] as const)('returns %s for %s%% battery', (pct, expected) => {
    expect(batteryColor(pct)).toBe(expected)
  })
})

describe('LOG_LEVEL_COLOR', () => {
  it('maps log levels to colors', () => {
    expect(LOG_LEVEL_COLOR.error).toBe('red')
    expect(LOG_LEVEL_COLOR.warning).toBe('yellow')
    expect(LOG_LEVEL_COLOR.info).toBe('blue')
  })
})
