import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import CalibrationCompleteStep from './CalibrationCompleteStep';

describe('CalibrationCompleteStep', () => {
  it('renders success message', () => {
    renderWithProviders(<CalibrationCompleteStep />);

    expect(screen.getByText('Sensor calibrated!')).toBeInTheDocument();
    expect(
      screen.getByText('Place the sensor back in the soil. It will take a reading in about 2 minutes.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Slide the probe in next to the plant, all the way into the soil.',
      ),
    ).toBeInTheDocument();
  });
});
