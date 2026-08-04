import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import ConnectStep from './ConnectStep';

vi.mock('@/assets/wifi-portal-home.png', () => ({ default: 'wifi-portal-home.png' }));
vi.mock('@/assets/wifi-portal-configure.png', () => ({ default: 'wifi-portal-configure.png' }));

describe('ConnectStep', () => {
  it('renders hotspot connection instructions', () => {
    renderWithProviders(<ConnectStep />);

    expect(screen.getByText('Connect to device hotspot')).toBeInTheDocument();
    expect(screen.getByText(/Make sure the setup code from the previous step is copied/i)).toBeInTheDocument();
    expect(screen.getByText(/Open the cap of the device/i)).toBeInTheDocument();
    expect(screen.getByText('RESTART')).toBeInTheDocument();
    expect(screen.getAllByText(/Plantir-Device-Setup/i).length).toBeGreaterThan(0);
    expect(screen.getByAltText('WiFi portal home screen')).toBeInTheDocument();
    expect(screen.getByAltText('WiFi portal configure screen')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => {
        const expected = 'Wait for the Plantir-Device-Setup portal to close automatically.';
        if (element?.textContent !== expected) return false;
        return !Array.from(element.children).some((child) => child.textContent === expected);
      }),
    ).toBeInTheDocument();
  });
});
