import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import PlantStatusChips from '@/components/shared/PlantStatusChips';

describe('PlantStatusChips', () => {
  it('renders a chip for each status with its label', () => {
    renderWithProviders(
      <PlantStatusChips statuses={['WATERING_NEEDED', 'RECHARGE_NEEDED']} />,
    );

    expect(screen.getByRole('button', { name: 'Needs water' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Needs recharge' })).toBeInTheDocument();
  });

  it('keeps Healthy icon-only by default and expands labels when expanded', () => {
    const { rerender } = renderWithProviders(<PlantStatusChips statuses={['HEALTHY']} />);

    const healthy = screen.getByRole('button', { name: 'Healthy' });
    expect(healthy).toHaveClass('filter-chip--icon-only');
    expect(healthy).toHaveClass('filter-chip--expand-label');
    expect(healthy).toHaveClass('filter-chip--static');

    rerender(<PlantStatusChips statuses={['HEALTHY']} expanded />);

    expect(screen.getByRole('button', { name: 'Healthy' })).not.toHaveClass('filter-chip--icon-only');
  });

  it('never collapses attention statuses to icon-only', () => {
    renderWithProviders(
      <PlantStatusChips statuses={['WATERING_NEEDED', 'OFFLINE', 'RECHARGE_NEEDED']} />,
    );

    expect(screen.getByRole('button', { name: 'Needs water' })).not.toHaveClass('filter-chip--icon-only');
    expect(screen.getByRole('button', { name: 'Offline' })).not.toHaveClass('filter-chip--icon-only');
    expect(screen.getByRole('button', { name: 'Needs recharge' })).not.toHaveClass('filter-chip--icon-only');
  });

  it('applies the matching variant class for each status', () => {
    renderWithProviders(
      <PlantStatusChips
        statuses={['HEALTHY', 'WATERING_NEEDED', 'OFFLINE', 'RECHARGE_NEEDED']}
        expanded
      />,
    );

    expect(screen.getByRole('button', { name: 'Healthy' })).toHaveClass('filter-chip--healthy');
    expect(screen.getByRole('button', { name: 'Healthy' })).toHaveClass('filter-chip--static');
    expect(screen.getByRole('button', { name: 'Needs water' })).toHaveClass('filter-chip--watering');
    expect(screen.getByRole('button', { name: 'Needs water' })).toHaveClass('filter-chip--static');
    expect(screen.getByRole('button', { name: 'Offline' })).toHaveClass('filter-chip--offline');
    expect(screen.getByRole('button', { name: 'Needs recharge' })).toHaveClass('filter-chip--recharge');
  });
});
