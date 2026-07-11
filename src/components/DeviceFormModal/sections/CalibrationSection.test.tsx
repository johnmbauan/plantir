import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { buildDevice } from '@/test/builders/device';
import { defaultFormValues } from '@/components/DeviceFormModal/utils';
import CalibrationSection from './CalibrationSection';

describe('CalibrationSection', () => {
  it('renders current calibration values', () => {
    const device = buildDevice();
    const form = defaultFormValues();

    renderWithProviders(
      <CalibrationSection
        calibration={form.humidityConfig}
        editingDevice={device}
      />,
    );

    expect(screen.getByText(/Air \(dry\):/)).toBeInTheDocument();
    expect(screen.getByText(String(form.humidityConfig.airValue))).toBeInTheDocument();
    expect(screen.getByText(/Water \(wet\):/)).toBeInTheDocument();
    expect(screen.getByText(String(form.humidityConfig.waterValue))).toBeInTheDocument();
  });

  it('calls onRecalibrate when recalibrate button is clicked', async () => {
    const user = userEvent.setup();
    const device = buildDevice();
    const onRecalibrate = vi.fn();

    renderWithProviders(
      <CalibrationSection
        calibration={defaultFormValues().humidityConfig}
        editingDevice={device}
        onRecalibrate={onRecalibrate}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Recalibrate sensor' }));

    expect(onRecalibrate).toHaveBeenCalledWith(device);
  });
});
