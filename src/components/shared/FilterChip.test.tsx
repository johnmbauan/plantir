import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import FilterChip from '@/components/shared/FilterChip';

describe('FilterChip', () => {
  const defaultProps = {
    icon: <span>🌿</span>,
    count: 5,
    label: 'healthy',
    variant: 'healthy' as const,
    active: false,
    onClick: vi.fn(),
  };

  it('renders the count and label text', () => {
    renderWithProviders(<FilterChip {...defaultProps} />);
    expect(screen.getByText('5 healthy')).toBeInTheDocument();
  });

  it('renders label without count when count is omitted', () => {
    renderWithProviders(
      <FilterChip icon={<span>🌿</span>} label="Healthy" variant="healthy" />,
    );
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    renderWithProviders(<FilterChip {...defaultProps} />);
    expect(screen.getByText('🌿')).toBeInTheDocument();
  });

  it('applies the variant modifier class', () => {
    renderWithProviders(<FilterChip {...defaultProps} variant="watering" />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--watering');
  });

  it('applies the snooze variant class', () => {
    renderWithProviders(
      <FilterChip icon={<span>🔕</span>} label="Snoozed · 23h left" variant="snooze" />,
    );
    expect(screen.getByRole('button')).toHaveClass('filter-chip--snooze');
  });

  it('adds the active modifier class when active=true', () => {
    renderWithProviders(<FilterChip {...defaultProps} active />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--active');
  });

  it('does not add the active modifier class when active=false', () => {
    renderWithProviders(<FilterChip {...defaultProps} active={false} />);
    expect(screen.getByRole('button')).not.toHaveClass('filter-chip--active');
  });

  it('adds the static modifier class when onClick is omitted', () => {
    renderWithProviders(
      <FilterChip icon={<span>🌿</span>} label="Healthy" variant="healthy" />,
    );
    expect(screen.getByRole('button')).toHaveClass('filter-chip--static');
  });

  it('adds the icon-only modifier class when iconOnly=true', () => {
    renderWithProviders(<FilterChip {...defaultProps} iconOnly />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--icon-only');
  });

  it('keeps the label available as aria-label when iconOnly', () => {
    renderWithProviders(<FilterChip {...defaultProps} iconOnly />);
    expect(screen.getByRole('button', { name: 'healthy' })).toBeInTheDocument();
  });

  it('renders rightSection content', () => {
    renderWithProviders(
      <FilterChip
        {...defaultProps}
        rightSection={<button type="button" aria-label="Remove snooze">×</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Remove snooze' })).toBeInTheDocument();
  });

  it('calls onClick when the button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<FilterChip {...defaultProps} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
