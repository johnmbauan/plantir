import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import PlantFilterSearch from '@/components/PlantFilterSearch';

function StatefulSearch({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <PlantFilterSearch value={value} onChange={setValue} />;
}

describe('PlantFilterSearch', () => {
  it('starts collapsed when value is empty', () => {
    const { container } = renderWithProviders(
      <PlantFilterSearch value="" onChange={vi.fn()} />,
    );
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    expect(container.querySelector('.filter-search')).not.toHaveClass('filter-search--open');
  });

  it('starts expanded when value is non-empty', () => {
    const { container } = renderWithProviders(
      <PlantFilterSearch value="fern" onChange={vi.fn()} />,
    );
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    expect(container.querySelector('.filter-search')).toHaveClass('filter-search--open');
  });

  it('expands when the search icon is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <PlantFilterSearch value="" onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Search plants' }));

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    expect(container.querySelector('.filter-search')).toHaveClass('filter-search--open');
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<PlantFilterSearch value="" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Search plants' }));
    await user.type(screen.getByPlaceholderText('Search plants…'), 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('updates the displayed value when controlled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StatefulSearch />);

    await user.click(screen.getByRole('button', { name: 'Search plants' }));
    await user.type(screen.getByPlaceholderText('Search plants…'), 'fern');

    expect(screen.getByDisplayValue('fern')).toBeInTheDocument();
  });

  it('shows a clear button when there is a value', () => {
    renderWithProviders(<PlantFilterSearch value="fern" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('clears the value when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<PlantFilterSearch value="fern" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('collapses on blur when the value is empty', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <PlantFilterSearch value="" onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Search plants' }));
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    expect(container.querySelector('.filter-search')).toHaveClass('filter-search--open');

    await user.click(document.body);

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    expect(container.querySelector('.filter-search')).not.toHaveClass('filter-search--open');
  });

  it('stays open on blur when the value is non-empty', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <PlantFilterSearch value="fern" onChange={vi.fn()} />,
    );

    await user.click(screen.getByPlaceholderText('Search plants…'));
    await user.tab();

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    expect(container.querySelector('.filter-search')).toHaveClass('filter-search--open');
  });
});
