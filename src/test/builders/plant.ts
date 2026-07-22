import type { EnrichedPlant } from '@/types';

export function buildPlant(overrides: Partial<EnrichedPlant> = {}): EnrichedPlant {
  return {
    id: 1,
    name: 'Monstera',
    image_url: null,
    created_at: '2026-01-01T00:00:00Z',
    is_outdoor: false,
    statuses: ['HEALTHY'],
    threshold: 15,
    lastMeasuredAt: '2026-07-06T08:00:00Z',
    deviceId: 1,
    serialNumber: 'SN-001',
    sleepDurationSeconds: 28800,
    humidityPercent: 55,
    batteryPercent: 80,
    ...overrides,
  };
}
