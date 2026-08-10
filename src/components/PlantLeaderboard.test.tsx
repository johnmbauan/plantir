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

  it('uses the Storage thumbnail URL for plant photos', () => {
    renderWithProviders(
      <PlantLeaderboard
        plants={[
          buildPlant({
            name: 'Monstera',
            image_url:
              'https://x.supabase.co/storage/v1/object/public/plant-images/user/abc.jpg',
          }),
        ]}
        loading={false}
      />,
    );

    expect(screen.getByRole('img', { name: 'Monstera' })).toHaveAttribute(
      'src',
      'https://x.supabase.co/storage/v1/object/public/plant-images/user/abc_thumb.jpg',
    );
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

  it('keeps the healthy status chip icon-only and shows labels for attention statuses', () => {
    const { rerender } = renderWithProviders(
      <PlantLeaderboard
        plants={[buildPlant({ statuses: ['HEALTHY'] })]}
        loading={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Healthy' })).toHaveClass('filter-chip--icon-only');
    expect(screen.getByRole('button', { name: 'Healthy' })).toHaveClass('filter-chip--expand-label');

    rerender(
      <PlantLeaderboard
        plants={[buildPlant({ statuses: ['WATERING_NEEDED', 'OFFLINE'] })]}
        loading={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Needs water' })).not.toHaveClass('filter-chip--icon-only');
    expect(screen.getByRole('button', { name: 'Offline' })).not.toHaveClass('filter-chip--icon-only');
  });

  it('does not render list rank numbers', () => {
    renderWithProviders(
      <PlantLeaderboard
        plants={[
          buildPlant({ id: 1, name: 'Fern' }),
          buildPlant({ id: 2, name: 'Pothos' }),
        ]}
        loading={false}
      />,
    );

    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('emphasizes last-seen time when the reading is stale', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-07-22T12:00:00.000Z'));

      renderWithProviders(
        <PlantLeaderboard
          plants={[
            buildPlant({
              id: 1,
              name: 'Fresh',
              statuses: ['HEALTHY'],
              lastMeasuredAt: '2026-07-22T11:00:00.000Z',
              sleepDurationSeconds: 28_800,
            }),
            buildPlant({
              id: 2,
              name: 'Stale',
              statuses: ['HEALTHY'],
              lastMeasuredAt: '2026-07-22T02:00:00.000Z',
              sleepDurationSeconds: 28_800,
            }),
            buildPlant({
              id: 3,
              name: 'Offline plant',
              statuses: ['OFFLINE'],
              lastMeasuredAt: '2026-07-22T11:30:00.000Z',
              sleepDurationSeconds: 28_800,
            }),
          ]}
          loading={false}
        />,
      );

      expect(screen.getByText('1h ago')).not.toHaveClass('leaderboard-time--stale');
      expect(screen.getByText('10h ago')).toHaveClass('leaderboard-time--stale');
      expect(screen.getByText('30m ago')).toHaveClass('leaderboard-time--stale');
    } finally {
      vi.useRealTimers();
    }
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

  it('shows the full snooze label instead of an icon-only chip', () => {
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

      const snoozeChip = screen.getByRole('button', { name: 'Snoozed · 23h left' });
      expect(snoozeChip).toBeInTheDocument();
      expect(snoozeChip).not.toHaveClass('filter-chip--icon-only');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows outdoor plant indicator next to the name', () => {
    renderWithProviders(
      <PlantLeaderboard
        plants={[buildPlant({ name: 'Rosemary', is_outdoor: true })]}
        loading={false}
      />,
    );

    expect(screen.getByLabelText('Outdoor plant')).toBeInTheDocument();
  });

  it('does not show outdoor indicator for indoor plants', () => {
    renderWithProviders(
      <PlantLeaderboard
        plants={[buildPlant({ name: 'Fern', is_outdoor: false })]}
        loading={false}
      />,
    );

    expect(screen.queryByLabelText('Outdoor plant')).not.toBeInTheDocument();
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
