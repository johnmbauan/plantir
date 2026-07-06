import { describe, it, expect } from 'vitest'
import { STATUS_CONFIG } from './plantStatus'
import type { PlantStatus } from '@/types'

const ALL_STATUSES: PlantStatus[] = ['HEALTHY', 'WATERING_NEEDED', 'OFFLINE', 'RECHARGE_NEEDED']

describe('STATUS_CONFIG', () => {
  it('defines config for every plant status', () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_CONFIG[status]).toEqual(
        expect.objectContaining({
          label: expect.any(String),
          color: expect.any(String),
          barColor: expect.any(String),
        }),
      )
    }
  })
})
