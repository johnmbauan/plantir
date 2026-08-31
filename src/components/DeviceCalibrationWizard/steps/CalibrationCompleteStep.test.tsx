import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import CalibrationCompleteStep from './CalibrationCompleteStep';

describe('CalibrationCompleteStep', () => {
  it('renders success message', () => {
    renderWithProviders(<CalibrationCompleteStep />);

    expect(screen.getByText('Sensor calibrated!')).toBeInTheDocument();
    expect(screen.getByText(/Place the sensor back in the soil/i)).toBeInTheDocument();
  });
});
