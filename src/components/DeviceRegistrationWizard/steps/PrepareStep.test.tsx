import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import PrepareStep from './PrepareStep';

const plantOptions = [
  { value: '1', label: 'Monstera' },
  { value: '2', label: 'Ficus' },
];

describe('PrepareStep', () => {
  it('shows a recommendation to use a PC or laptop', () => {
    renderWithProviders(
      <PrepareStep plantOptions={plantOptions} plantId={null} onPlantChange={vi.fn()} />,
    );

    expect(
      screen.getByText(/recommend completing this setup from a PC or laptop/i),
    ).toBeInTheDocument();
  });

  it('renders intro text and plant selector', () => {
    renderWithProviders(
      <PrepareStep plantOptions={plantOptions} plantId={null} onPlantChange={vi.fn()} />,
    );

    expect(screen.getByText(/registering a Plantir humidity sensor/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('You can assign a plant now or later')).toBeInTheDocument();
  });

  it('shows helper text for plants that already have a device', () => {
    renderWithProviders(
      <PrepareStep
        plantOptions={[
          { value: '1', label: 'Monstera', hasDevice: true },
          { value: '2', label: 'Ficus', hasDevice: false },
        ]}
        plantId={null}
        onPlantChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Plants that already have a device assigned are disabled.'),
    ).toBeInTheDocument();
  });

  it('reflects selected plant in the selector', () => {
    renderWithProviders(
      <PrepareStep plantOptions={plantOptions} plantId="1" onPlantChange={vi.fn()} />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('Monstera');
  });
});
