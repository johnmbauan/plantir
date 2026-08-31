import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import App from './App';
import { mockSession, resetSupabaseMocks } from '@/test/mocks/supabase';
import { buildSession } from '@/test/builders/session';

vi.mock('@/pages/Dashboard', () => ({
  default: () => <div>Dashboard page</div>,
}));

vi.mock('@/pages/PlantCenter', () => ({
  default: () => <div>Plant center page</div>,
}));

vi.mock('@/pages/SettingsPage', () => ({
  default: () => <div>Settings page</div>,
}));

vi.mock('@/admin/AdminPage', () => ({
  default: () => <div>Admin page</div>,
}));

function renderApp(initialRoute = '/') {
  window.history.pushState({}, '', initialRoute);
  return render(
    <MantineProvider>
      <App />
    </MantineProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockSession(null);
  });

  it('renders landing page for unauthenticated visitors at the root', async () => {
    renderApp('/');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: 'Know when they need you.',
        }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: 'Sign in' }).length).toBeGreaterThan(0);
    });
  });

  it('renders login page for unauthenticated users', async () => {
    renderApp('/login');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Plantir' })).toBeInTheDocument();
      expect(screen.getByTestId('brand-logo-mark')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });
  });

  it('renders dashboard for authenticated users', async () => {
    mockSession(buildSession());

    renderApp('/dashboard');

    await waitFor(() => {
      expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    });
  });

  it('renders plant center route', async () => {
    mockSession(buildSession());

    renderApp('/plants-center');

    await waitFor(() => {
      expect(screen.getByText('Plant center page')).toBeInTheDocument();
    });
  });
});
