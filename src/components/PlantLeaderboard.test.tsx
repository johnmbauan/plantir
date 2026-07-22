import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { buildPlant } from '@/test/builders/plant';
import type { PlantStatus } from '@/types';
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
    ['var(--green-400)', { statuses: ['HEALTHY'] as PlantStatus[], humidityPercent: 35, threshold: 30 }],
    ['var(--terracotta-500)', { statuses: ['WATERING_NEEDED'] as PlantStatus[], humidityPercent: 25, threshold: 30 }],
    ['#9ca3af', { statuses: ['OFFLINE'] as PlantStatus[], humidityPercent: 25, threshold: 30 }],
  ])(
    'passes %s to HumidityBar for primary status',
    (expectedColor, overrides) => {
      renderWithProviders(
        <PlantLeaderboard plants={[buildPlant(overrides)]} loading={false} />,
      );

      expect(screen.getByTestId('humidity-bar')).toHaveAttribute('data-bar-color', expectedColor);
    },
  );

  it('uses status bar color regardless of missing humidity or threshold', () => {
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

  it('renders status chips for plant statuses', () => {
    renderWithProviders(
      <PlantLeaderboard
        plants={[buildPlant({ statuses: ['WATERING_NEEDED', 'RECHARGE_NEEDED'] })]}
        loading={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Needs water' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Needs recharge' })).toBeInTheDocument();
  });

  it('shows battery percent below the plant name', () => {
    renderWithProviders(
      <PlantLeaderboard
        plants={[buildPlant({ batteryPercent: 42 })]}
        loading={false}
      />,
    );

    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('shows a snooze chip when the plant is snoozed', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-07-22T12:00:00.000Z'));

      renderWithProviders(
        <PlantLeaderboard
          plants={[buildPlant({ id: 3, name: 'Fern' })]}
          loading={false}
          snoozedUntilByPlantId={new Map([[3, '2026-07-23T11:00:00.000Z']])}
        />,
      );

      expect(screen.getByRole('button', { name: 'Snoozed · 23h left' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('calls onUnsnooze without opening the plant when remove snooze is clicked', async () => {
    const user = userEvent.setup();
    const onUnsnooze = vi.fn();
    const onPlantClick = vi.fn();
    const plant = buildPlant({ id: 3, name: 'Fern' });

    renderWithProviders(
      <PlantLeaderboard
        plants={[plant]}
        loading={false}
        snoozedUntilByPlantId={new Map([[3, '2026-07-23T11:00:00.000Z']])}
        onUnsnooze={onUnsnooze}
        onPlantClick={onPlantClick}
      />,
    );

    await user.click(screen.getByLabelText('Remove snooze'));

    expect(onUnsnooze).toHaveBeenCalledWith(3);
    expect(onPlantClick).not.toHaveBeenCalled();
  });
});
