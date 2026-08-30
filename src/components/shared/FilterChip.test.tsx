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

  it('adds the active modifier class when active=true and the chip is clickable', () => {
    renderWithProviders(<FilterChip {...defaultProps} active />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--active');
    expect(screen.getByRole('button')).not.toHaveClass('filter-chip--static');
  });

  it('does not add the active modifier class when active=false', () => {
    renderWithProviders(<FilterChip {...defaultProps} active={false} />);
    expect(screen.getByRole('button')).not.toHaveClass('filter-chip--active');
  });

  it('does not add the active modifier class when onClick is omitted', () => {
    renderWithProviders(
      <FilterChip icon={<span>🌿</span>} label="Healthy" variant="healthy" active />,
    );
    expect(screen.getByRole('button')).not.toHaveClass('filter-chip--active');
    expect(screen.getByRole('button')).toHaveClass('filter-chip--static');
  });

  it('adds the static modifier class when onClick is omitted', () => {
    renderWithProviders(
      <FilterChip icon={<span>🌿</span>} label="Healthy" variant="healthy" />,
    );
    expect(screen.getByRole('button')).toHaveClass('filter-chip--static');
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1');
  });

  it('keeps clickable chips in the tab order', () => {
    renderWithProviders(<FilterChip {...defaultProps} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button')).not.toHaveClass('filter-chip--static');
  });

  it('keeps expand-label on static icon-only chips', () => {
    renderWithProviders(
      <FilterChip icon={<span>🌿</span>} label="Healthy" variant="healthy" iconOnly />,
    );
    expect(screen.getByRole('button')).toHaveClass('filter-chip--static');
    expect(screen.getByRole('button')).toHaveClass('filter-chip--icon-only');
    expect(screen.getByRole('button')).toHaveClass('filter-chip--expand-label');
  });

  it('adds the icon-only modifier class when iconOnly=true', () => {
    renderWithProviders(<FilterChip {...defaultProps} iconOnly />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--icon-only');
  });

  it('adds the expand-label class by default when iconOnly', () => {
    renderWithProviders(<FilterChip {...defaultProps} iconOnly />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--expand-label');
  });

  it('omits the expand-label class when expandLabel=false', () => {
    renderWithProviders(<FilterChip {...defaultProps} iconOnly expandLabel={false} />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--icon-only');
    expect(screen.getByRole('button')).not.toHaveClass('filter-chip--expand-label');
  });

  it('keeps the label available as aria-label when iconOnly', () => {
    renderWithProviders(<FilterChip {...defaultProps} iconOnly />);
    expect(screen.getByRole('button', { name: 'healthy' })).toBeInTheDocument();
  });

  it('applies the calibration, edit, and danger variant classes', () => {
    const { rerender } = renderWithProviders(
      <FilterChip icon={<span>⚙</span>} label="Calibration recommended" variant="calibration" />,
    );
    expect(screen.getByRole('button')).toHaveClass('filter-chip--calibration');

    rerender(<FilterChip icon={<span>✎</span>} label="Edit plant" variant="edit" />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--edit');

    rerender(<FilterChip icon={<span>🗑</span>} label="Delete plant" variant="danger" />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--danger');
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
