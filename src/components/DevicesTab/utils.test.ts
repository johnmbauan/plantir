import { describe, it, expect } from 'vitest';
import { buildDevice, buildHumidityConfig } from '@/test/builders/device';
import {
  deviceMatchesSearch,
  isDeviceCalibrated,
  sortDevicesByColumn,
} from '@/components/DevicesTab/utils';

describe('isDeviceCalibrated', () => {
  it('returns true when calibrated_at is set', () => {
    expect(
      isDeviceCalibrated(
        buildDevice({
          humidityConfig: buildHumidityConfig({ calibrated_at: '2026-01-01T00:00:00Z' }),
        }),
      ),
    ).toBe(true);
  });

  it('returns false when calibrated_at is missing or null', () => {
    expect(
      isDeviceCalibrated(
        buildDevice({ humidityConfig: buildHumidityConfig({ calibrated_at: null }) }),
      ),
    ).toBe(false);
    expect(isDeviceCalibrated(buildDevice({ humidityConfig: null }))).toBe(false);
  });
});

describe('deviceMatchesSearch', () => {
  it('matches empty search against any device', () => {
    expect(deviceMatchesSearch(buildDevice(), '')).toBe(true);
    expect(deviceMatchesSearch(buildDevice(), '   ')).toBe(true);
  });

  it('matches serial number and plant name case-insensitively', () => {
    const device = buildDevice({ serialNumber: 'SN-ABC', plantName: 'Fern' });
    expect(deviceMatchesSearch(device, 'abc')).toBe(true);
    expect(deviceMatchesSearch(device, 'fer')).toBe(true);
    expect(deviceMatchesSearch(device, 'zzz')).toBe(false);
  });

  it('handles missing plant name', () => {
    expect(deviceMatchesSearch(buildDevice({ plantName: null }), 'monstera')).toBe(false);
  });
});

describe('sortDevicesByColumn', () => {
  it('sorts by serial ascending and descending', () => {
    const devices = [
      buildDevice({ id: 1, serialNumber: 'SN-M' }),
      buildDevice({ id: 2, serialNumber: 'SN-Z' }),
      buildDevice({ id: 3, serialNumber: 'SN-A' }),
    ];

    expect(sortDevicesByColumn(devices, 'serial', 'asc').map((d) => d.serialNumber)).toEqual([
      'SN-A',
      'SN-M',
      'SN-Z',
    ]);
    expect(sortDevicesByColumn(devices, 'serial', 'desc').map((d) => d.serialNumber)).toEqual([
      'SN-Z',
      'SN-M',
      'SN-A',
    ]);
  });

  it('sorts by plant name and keeps unassigned last', () => {
    const devices = [
      buildDevice({ id: 1, serialNumber: 'SN-1', plantName: 'Mango' }),
      buildDevice({ id: 2, serialNumber: 'SN-2', plantName: 'Zebra' }),
      buildDevice({ id: 3, serialNumber: 'SN-3', plantName: null }),
      buildDevice({ id: 4, serialNumber: 'SN-4', plantName: 'Apple' }),
    ];

    expect(sortDevicesByColumn(devices, 'plant', 'asc').map((d) => d.serialNumber)).toEqual([
      'SN-4',
      'SN-1',
      'SN-2',
      'SN-3',
    ]);
    expect(sortDevicesByColumn(devices, 'plant', 'desc').map((d) => d.serialNumber)).toEqual([
      'SN-2',
      'SN-1',
      'SN-4',
      'SN-3',
    ]);
  });

  it('falls back to serial when plant names are equal or both missing', () => {
    const equalNames = [
      buildDevice({ id: 1, serialNumber: 'SN-B', plantName: 'Fern' }),
      buildDevice({ id: 2, serialNumber: 'SN-A', plantName: 'Fern' }),
    ];
    expect(sortDevicesByColumn(equalNames, 'plant', 'asc').map((d) => d.serialNumber)).toEqual([
      'SN-A',
      'SN-B',
    ]);

    const bothUnassigned = [
      buildDevice({ id: 1, serialNumber: 'SN-B', plantName: null }),
      buildDevice({ id: 2, serialNumber: 'SN-A', plantName: null }),
    ];
    expect(sortDevicesByColumn(bothUnassigned, 'plant', 'asc').map((d) => d.serialNumber)).toEqual([
      'SN-A',
      'SN-B',
    ]);
  });

  it('sorts by interval and keeps missing config last', () => {
    const devices = [
      buildDevice({
        id: 1,
        serialNumber: 'SN-MID',
        humidityConfig: buildHumidityConfig({ sleepDurationSeconds: 14_400 }),
      }),
      buildDevice({
        id: 2,
        serialNumber: 'SN-HIGH',
        humidityConfig: buildHumidityConfig({ sleepDurationSeconds: 28_800 }),
      }),
      buildDevice({
        id: 3,
        serialNumber: 'SN-LOW',
        humidityConfig: buildHumidityConfig({ sleepDurationSeconds: 3_600 }),
      }),
      buildDevice({ id: 4, serialNumber: 'SN-NONE', humidityConfig: null }),
    ];

    expect(sortDevicesByColumn(devices, 'interval', 'asc').map((d) => d.serialNumber)).toEqual([
      'SN-LOW',
      'SN-MID',
      'SN-HIGH',
      'SN-NONE',
    ]);
    expect(sortDevicesByColumn(devices, 'interval', 'desc').map((d) => d.serialNumber)).toEqual([
      'SN-HIGH',
      'SN-MID',
      'SN-LOW',
      'SN-NONE',
    ]);
  });

  it('falls back to serial when intervals are equal or both missing', () => {
    const equalIntervals = [
      buildDevice({
        id: 1,
        serialNumber: 'SN-B',
        humidityConfig: buildHumidityConfig({ sleepDurationSeconds: 3_600 }),
      }),
      buildDevice({
        id: 2,
        serialNumber: 'SN-A',
        humidityConfig: buildHumidityConfig({ sleepDurationSeconds: 3_600 }),
      }),
    ];
    expect(sortDevicesByColumn(equalIntervals, 'interval', 'asc').map((d) => d.serialNumber)).toEqual([
      'SN-A',
      'SN-B',
    ]);

    const bothMissing = [
      buildDevice({ id: 1, serialNumber: 'SN-B', humidityConfig: null }),
      buildDevice({ id: 2, serialNumber: 'SN-A', humidityConfig: null }),
    ];
    expect(sortDevicesByColumn(bothMissing, 'interval', 'asc').map((d) => d.serialNumber)).toEqual([
      'SN-A',
      'SN-B',
    ]);
  });
});
