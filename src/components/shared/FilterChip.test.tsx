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

  it('renders the icon', () => {
    renderWithProviders(<FilterChip {...defaultProps} />);
    expect(screen.getByText('🌿')).toBeInTheDocument();
  });

  it('applies the variant modifier class', () => {
    renderWithProviders(<FilterChip {...defaultProps} variant="watering" />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--watering');
  });

  it('adds the active modifier class when active=true', () => {
    renderWithProviders(<FilterChip {...defaultProps} active />);
    expect(screen.getByRole('button')).toHaveClass('filter-chip--active');
  });

  it('does not add the active modifier class when active=false', () => {
    renderWithProviders(<FilterChip {...defaultProps} active={false} />);
    expect(screen.getByRole('button')).not.toHaveClass('filter-chip--active');
  });

  it('calls onClick when the button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<FilterChip {...defaultProps} onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
