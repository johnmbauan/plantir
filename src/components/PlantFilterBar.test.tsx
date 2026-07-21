import { useState, type ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import PlantFilterBar from '@/components/PlantFilterBar';

function StatefulPlantFilterBar(
  props: Omit<ComponentProps<typeof PlantFilterBar>, 'search' | 'onSearchChange'>,
) {
  const [search, setSearch] = useState('');
  return <PlantFilterBar {...props} search={search} onSearchChange={setSearch} />;
}

const defaultCounts = {
  healthy: 3,
  wateringNeeded: 1,
  offline: 0,
  rechargeNeeded: 2,
};

const defaultProps = {
  counts: defaultCounts,
  activeFilter: 'all' as const,
  search: '',
  sortBy: 'name' as const,
  onToggleFilter: vi.fn(),
  onSearchChange: vi.fn(),
  onSortChange: vi.fn(),
  onRefresh: vi.fn(),
};

describe('PlantFilterBar', () => {
  it('shows plant count badges', () => {
    renderWithProviders(<PlantFilterBar {...defaultProps} />);

    expect(screen.getByText(/3 healthy/)).toBeInTheDocument();
    expect(screen.getByText(/1 need watering/)).toBeInTheDocument();
    expect(screen.getByText(/2 need recharge/)).toBeInTheDocument();
  });

  it('calls onToggleFilter when a status badge is clicked', async () => {
    const user = userEvent.setup();
    const onToggleFilter = vi.fn();

    renderWithProviders(<PlantFilterBar {...defaultProps} onToggleFilter={onToggleFilter} />);

    await user.click(screen.getByText(/3 healthy/));
    expect(onToggleFilter).toHaveBeenCalledWith('HEALTHY');
  });

  it('updates the search field when typing', async () => {
    const user = userEvent.setup();

    renderWithProviders(<StatefulPlantFilterBar {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search plants…'), 'fern');
    expect(screen.getByDisplayValue('fern')).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    renderWithProviders(<PlantFilterBar {...defaultProps} onRefresh={onRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Refresh dashboard' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('calls onToggleFilter for offline and recharge badges', async () => {
    const user = userEvent.setup();
    const onToggleFilter = vi.fn();

    renderWithProviders(
      <PlantFilterBar
        {...defaultProps}
        counts={{ ...defaultCounts, offline: 2 }}
        onToggleFilter={onToggleFilter}
      />,
    );

    await user.click(screen.getByText(/2 offline/));
    expect(onToggleFilter).toHaveBeenCalledWith('OFFLINE');

    await user.click(screen.getByText(/2 need recharge/));
    expect(onToggleFilter).toHaveBeenCalledWith('RECHARGE_NEEDED');
  });

  it('calls onSortChange when sort option is selected', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();

    renderWithProviders(<PlantFilterBar {...defaultProps} onSortChange={onSortChange} />);

    await user.click(screen.getByRole('textbox', { name: 'Sort plants' }));
    await user.click(await screen.findByText('Humidity (lowest first)'));

    expect(onSortChange).toHaveBeenCalledWith('humidity-low');
  });

  it('applies active styling to the selected filter badge', () => {
    renderWithProviders(
      <PlantFilterBar {...defaultProps} activeFilter="WATERING_NEEDED" />,
    );

    // eslint-disable-next-line testing-library/no-node-access
    const activeBadge = document.querySelector('.filter-chip--active');
    expect(activeBadge).toHaveTextContent(/need watering/);
  });
});
