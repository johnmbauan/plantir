import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { buildPlant } from '@/test/builders/plant';
import type { EnrichedPlant } from '@/types';
import PlantLeaderboard from './PlantLeaderboard';

vi.mock('@/components/HumidityBar', () => ({
  default: (props: { barColor: string }) => (
    <div data-testid="humidity-bar" data-bar-color={props.barColor} />
  ),
}));

describe('PlantLeaderboard', () => {
  it('shows loading skeletons while loading', () => {
    renderWithProviders(<PlantLeaderboard plants={[]} loading />);
    expect(screen.queryByText('Monstera')).not.toBeInTheDocument();
  });

  it('renders plant rows when data is loaded', () => {
    renderWithProviders(
      <PlantLeaderboard plants={[buildPlant({ name: 'Monstera' })]} loading={false} />,
    );
    expect(screen.getByText('Monstera')).toBeInTheDocument();
  });

  it('shows empty state with action', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    renderWithProviders(
      <PlantLeaderboard
        plants={[]}
        loading={false}
        emptyState={{
          title: 'No plants yet',
          actionLabel: 'Add first plant',
          onAction,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add first plant' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('calls onPlantClick when a row is clicked', async () => {
    const user = userEvent.setup();
    const plant = buildPlant({ id: 5, name: 'Fern' });
    const onPlantClick = vi.fn();

    renderWithProviders(
      <PlantLeaderboard plants={[plant]} loading={false} onPlantClick={onPlantClick} />,
    );

    await user.click(screen.getByText('Fern'));
    expect(onPlantClick).toHaveBeenCalledWith(plant);
  });

  it.each([
    ['var(--green-400)', { humidityPercent: 35, threshold: 30 }],
    ['var(--terracotta-500)', { humidityPercent: 32, threshold: 30 }],
    ['var(--mantine-color-red-6)', { humidityPercent: 25, threshold: 30 }],
  ] as const)(
    'passes %s to HumidityBar when humidity is %s',
    (expectedColor: string, overrides: Partial<EnrichedPlant>) => {
      renderWithProviders(
        <PlantLeaderboard plants={[buildPlant(overrides)]} loading={false} />,
      );

      expect(screen.getByTestId('humidity-bar')).toHaveAttribute('data-bar-color', expectedColor);
    },
  );

  it('falls back to status bar color when humidity or threshold is missing', () => {
    renderWithProviders(
      <PlantLeaderboard
        plants={[
          buildPlant({ statuses: ['OFFLINE'], humidityPercent: null, threshold: 30 }),
          buildPlant({ statuses: ['HEALTHY'], humidityPercent: 40, threshold: null }),
        ]}
        loading={false}
      />,
    );

    const bars = screen.getAllByTestId('humidity-bar');
    expect(bars[0]).toHaveAttribute('data-bar-color', '#9ca3af');
    expect(bars[1]).toHaveAttribute('data-bar-color', 'var(--green-400)');
  });
});
