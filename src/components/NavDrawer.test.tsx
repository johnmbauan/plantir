import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import NavDrawer from '@/components/NavDrawer';

describe('NavDrawer', () => {
  it('shows navigation links when opened', () => {
    renderWithProviders(
      <NavDrawer opened onClose={vi.fn()} />,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plants Center' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
  });

  it('shows admin link for admin users', () => {
    renderWithProviders(
      <NavDrawer opened onClose={vi.fn()} isAdmin />,
    );

    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('hides admin link for non-admin users', () => {
    renderWithProviders(
      <NavDrawer opened onClose={vi.fn()} />,
    );

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });
});
