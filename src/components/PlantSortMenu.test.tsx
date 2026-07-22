import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import PlantSortMenu from '@/components/PlantSortMenu';

describe('PlantSortMenu', () => {
  it('renders the sort button', () => {
    renderWithProviders(
      <PlantSortMenu value="humidity-low" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Sort plants' })).toBeInTheDocument();
  });

  it('does not mark the button active for the default sort', () => {
    renderWithProviders(
      <PlantSortMenu value="humidity-low" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Sort plants' })).not.toHaveClass(
      'filter-icon-btn--active',
    );
  });

  it('marks the button active for a non-default sort', () => {
    renderWithProviders(
      <PlantSortMenu value="name" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Sort plants' })).toHaveClass(
      'filter-icon-btn--active',
    );
  });

  it('calls onChange when a sort option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <PlantSortMenu value="name" onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Sort plants' }));
    await user.click(await screen.findByText('Humidity (lowest first)'));

    expect(onChange).toHaveBeenCalledWith('humidity-low');
  });

  it('lists all sort options', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <PlantSortMenu value="humidity-low" onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Sort plants' }));

    expect(await screen.findByText('Humidity (lowest first)')).toBeInTheDocument();
    expect(screen.getByText('Humidity (highest first)')).toBeInTheDocument();
    expect(screen.getByText('Last seen (recent first)')).toBeInTheDocument();
    expect(screen.getByText('Name (A-Z)')).toBeInTheDocument();
  });
});
