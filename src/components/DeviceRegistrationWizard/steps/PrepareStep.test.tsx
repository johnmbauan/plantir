import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import PrepareStep from './PrepareStep';

const plantOptions = [
  { value: '1', label: 'Monstera' },
  { value: '2', label: 'Ficus' },
];

describe('PrepareStep', () => {
  it('renders intro text and plant selector', () => {
    renderWithProviders(
      <PrepareStep plantOptions={plantOptions} plantId={null} onPlantChange={vi.fn()} />,
    );

    expect(screen.getByText(/registering a Plantir humidity sensor/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('You can assign a plant now or later')).toBeInTheDocument();
  });

  it('reflects selected plant in the selector', () => {
    renderWithProviders(
      <PrepareStep plantOptions={plantOptions} plantId="1" onPlantChange={vi.fn()} />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('Monstera');
  });
});
