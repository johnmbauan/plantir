import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeviceForm } from './useDeviceForm';
import { buildDevice } from '@/test/builders/device';
import { DEFAULT_HUMIDITY_CONFIG } from '@/constants/deviceDefaults';

vi.mock('@/services/deviceService', () => ({
  createDevice: vi.fn(),
  updateDevice: vi.fn(),
}));

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

import { createDevice, updateDevice } from '@/services/deviceService';

const baseOptions = {
  opened: true,
  editingDevice: null,
  plantOptions: [{ value: '10', label: 'Monstera', recommendedThreshold: 42 }],
  onClose: vi.fn(),
  onSaved: vi.fn(),
};

describe('useDeviceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('defaults reporting interval to 8h for new devices', () => {
    const { result } = renderHook(() => useDeviceForm(baseOptions));

    expect(result.current.intervalPreset).toBe(
      String(DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds),
    );
    expect(result.current.form.humidityConfig.sleepDurationSeconds).toBe(
      DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds,
    );
  });

  it('requires serial number when creating a device', () => {
    const { result } = renderHook(() => useDeviceForm(baseOptions));

    expect(result.current.validation.serial).toBe('Serial number is required');
    expect(result.current.isValid).toBe(false);
  });

  it('is valid when all fields pass validation', () => {
    const { result } = renderHook(() => useDeviceForm(baseOptions));

    act(() => {
      result.current.setForm((prev) => ({
        ...prev,
        serialNumber: 'SN-NEW',
      }));
    });

    expect(result.current.validation).toEqual({});
    expect(result.current.isValid).toBe(true);
  });

  it('flags invalid humidity threshold', () => {
    const { result } = renderHook(() => useDeviceForm(baseOptions));

    act(() => {
      result.current.setForm((prev) => ({
        ...prev,
        serialNumber: 'SN-NEW',
      }));
      result.current.setHumidityField('minHumidityThreshold', 150);
    });

    expect(result.current.validation.threshold).toBe('Threshold must be between 0 and 100');
    expect(result.current.isValid).toBe(false);
  });

  it('flags invalid sleep interval', () => {
    const { result } = renderHook(() => useDeviceForm(baseOptions));

    act(() => {
      result.current.setForm((prev) => ({
        ...prev,
        serialNumber: 'SN-NEW',
      }));
      result.current.handleCustomIntervalChange('');
    });

    expect(result.current.validation.interval).toBe('Interval must be at least 1 second');
    expect(result.current.isValid).toBe(false);
  });

  it('skips serial validation when editing an existing device', () => {
    const device = buildDevice({ serialNumber: 'SN-001' });

    const { result } = renderHook(() =>
      useDeviceForm({ ...baseOptions, editingDevice: device }),
    );

    expect(result.current.isEditing).toBe(true);
    expect(result.current.validation.serial).toBeUndefined();
    expect(result.current.isValid).toBe(true);
    expect(result.current.form.serialNumber).toBe('SN-001');
    expect(result.current.form.humidityConfig.sleepDurationSeconds).toBe(
      DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds,
    );
  });

  it('creates a device on save', async () => {
    vi.mocked(createDevice).mockResolvedValue({ id: 99 });

    const { result } = renderHook(() => useDeviceForm(baseOptions));

    act(() => {
      result.current.setForm((prev) => ({ ...prev, serialNumber: 'SN-NEW', plantId: 10 }));
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(createDevice).toHaveBeenCalled();
    expect(result.current.createdDevice).toMatchObject({ id: 99, serialNumber: 'SN-NEW' });
  });

  it('updates a device on save when editing', async () => {
    const device = buildDevice();
    const onClose = vi.fn();
    const onSaved = vi.fn();
    vi.mocked(updateDevice).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDeviceForm({ ...baseOptions, editingDevice: device, onClose, onSaved }),
    );

    act(() => {
      result.current.setHumidityField('minHumidityThreshold', 45);
    });

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(updateDevice).toHaveBeenCalledWith(device.id, expect.any(Object));
    });
    expect(onClose).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
  });

  it('does not save when editing without changes', async () => {
    const device = buildDevice();

    const { result } = renderHook(() =>
      useDeviceForm({ ...baseOptions, editingDevice: device }),
    );

    expect(result.current.isDirty).toBe(false);

    await act(async () => {
      await result.current.handleSave();
    });

    expect(updateDevice).not.toHaveBeenCalled();
  });

  it('applies interval preset changes', () => {
    const { result } = renderHook(() => useDeviceForm(baseOptions));

    act(() => {
      result.current.handleIntervalPresetChange('3600');
    });

    expect(result.current.intervalPreset).toBe('3600');
    expect(result.current.form.humidityConfig.sleepDurationSeconds).toBe(3600);
  });

  it('prefills threshold from selected plant recommended moisture', () => {
    const { result } = renderHook(() => useDeviceForm(baseOptions));

    act(() => {
      result.current.handlePlantChange(10);
    });

    expect(result.current.form.humidityConfig.minHumidityThreshold).toBe(42);
    expect(result.current.recommendedThreshold).toBe(42);
  });

  it('does not overwrite threshold after manual user adjustment', () => {
    const { result } = renderHook(() =>
      useDeviceForm({
        ...baseOptions,
        plantOptions: [
          { value: '10', label: 'Monstera', recommendedThreshold: 42 },
          { value: '20', label: 'Ficus', recommendedThreshold: 30 },
        ],
      }),
    );

    act(() => {
      result.current.handlePlantChange(10);
    });
    expect(result.current.form.humidityConfig.minHumidityThreshold).toBe(42);

    act(() => {
      result.current.setHumidityField('minHumidityThreshold', 55);
    });
    expect(result.current.form.humidityConfig.minHumidityThreshold).toBe(55);

    act(() => {
      result.current.handlePlantChange(20);
    });
    expect(result.current.form.humidityConfig.minHumidityThreshold).toBe(55);
    expect(result.current.recommendedThreshold).toBe(30);
  });

  it('shows error notification when save fails', async () => {
    const { notifications } = await import('@mantine/notifications');
    vi.mocked(createDevice).mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useDeviceForm(baseOptions));

    act(() => {
      result.current.setForm((prev) => ({ ...prev, serialNumber: 'SN-NEW' }));
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Error', message: 'Save failed' }),
    );
  });

  it('calls onOpenCalibration via handleOpenCalibration', () => {
    const device = buildDevice();
    const onClose = vi.fn();
    const onOpenCalibration = vi.fn();

    const { result } = renderHook(() =>
      useDeviceForm({ ...baseOptions, editingDevice: device, onClose, onOpenCalibration }),
    );

    act(() => {
      result.current.handleOpenCalibration(device);
    });

    expect(onClose).toHaveBeenCalled();
    expect(onOpenCalibration).toHaveBeenCalledWith(device);
  });

  it('calls handleOpenCalibration from handleCalibrateNow after create', async () => {
    vi.mocked(createDevice).mockResolvedValue({ id: 99 });
    const onOpenCalibration = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useDeviceForm({ ...baseOptions, onClose, onOpenCalibration }),
    );

    act(() => {
      result.current.setForm((prev) => ({ ...prev, serialNumber: 'SN-NEW' }));
    });

    await act(async () => {
      await result.current.handleSave();
    });

    act(() => {
      result.current.handleCalibrateNow();
    });

    expect(onClose).toHaveBeenCalled();
    expect(onOpenCalibration).toHaveBeenCalledWith(
      expect.objectContaining({ id: 99, serialNumber: 'SN-NEW' }),
    );
  });

  it('resets createdDevice on handleClose', async () => {
    vi.mocked(createDevice).mockResolvedValue({ id: 99 });
    const onClose = vi.fn();

    const { result } = renderHook(() => useDeviceForm({ ...baseOptions, onClose }));

    act(() => {
      result.current.setForm((prev) => ({ ...prev, serialNumber: 'SN-NEW' }));
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.createdDevice).not.toBeNull();

    act(() => {
      result.current.handleClose();
    });

    expect(window.confirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(result.current.createdDevice).toBeNull();
  });

  it('calls onFinished when closing after a successful create', async () => {
    vi.mocked(createDevice).mockResolvedValue({ id: 99 });
    const onClose = vi.fn();
    const onFinished = vi.fn();

    const { result } = renderHook(() => useDeviceForm({ ...baseOptions, onClose, onFinished }));

    act(() => {
      result.current.setForm((prev) => ({ ...prev, serialNumber: 'SN-NEW' }));
    });

    await act(async () => {
      await result.current.handleSave();
    });

    act(() => {
      result.current.handleClose();
    });

    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('does not call onFinished when calibrating after create', async () => {
    vi.mocked(createDevice).mockResolvedValue({ id: 99 });
    const onFinished = vi.fn();
    const onOpenCalibration = vi.fn();

    const { result } = renderHook(() =>
      useDeviceForm({ ...baseOptions, onFinished, onOpenCalibration }),
    );

    act(() => {
      result.current.setForm((prev) => ({ ...prev, serialNumber: 'SN-NEW' }));
    });

    await act(async () => {
      await result.current.handleSave();
    });

    act(() => {
      result.current.handleCalibrateNow();
    });

    expect(onFinished).not.toHaveBeenCalled();
  });

  it('does not close when discard is cancelled', () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const onClose = vi.fn();

    const { result } = renderHook(() => useDeviceForm({ ...baseOptions, onClose }));

    act(() => {
      result.current.setForm((prev) => ({ ...prev, serialNumber: 'SN-NEW' }));
    });

    act(() => {
      result.current.handleClose();
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
