import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import NavDrawer from '@/components/NavDrawer';

describe('NavDrawer', () => {
  it('shows navigation links when opened', () => {
    renderWithProviders(
      <NavDrawer opened onClose={vi.fn()} onSignOut={vi.fn()} />,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plants Center' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('shows admin link for admin users', () => {
    renderWithProviders(
      <NavDrawer opened onClose={vi.fn()} onSignOut={vi.fn()} isAdmin />,
    );

    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('hides admin link for non-admin users', () => {
    renderWithProviders(
      <NavDrawer opened onClose={vi.fn()} onSignOut={vi.fn()} />,
    );

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('calls onSignOut and onClose when signing out', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    const onClose = vi.fn();

    renderWithProviders(
      <NavDrawer opened onClose={onClose} onSignOut={onSignOut} />,
    );

    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
