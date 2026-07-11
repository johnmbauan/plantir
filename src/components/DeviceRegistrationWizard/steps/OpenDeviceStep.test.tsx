import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import OpenDeviceStep from './OpenDeviceStep';

describe('OpenDeviceStep', () => {
  it('renders device opening instructions', () => {
    renderWithProviders(<OpenDeviceStep />);

    expect(screen.getByText('Open device')).toBeInTheDocument();
    expect(screen.getByText(/Open the cap of the device/i)).toBeInTheDocument();
    expect(screen.getByText(/board reset button is reachable/i)).toBeInTheDocument();
  });
});
