import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import {
  mockAuthenticatedUser,
  mockSession,
  resetSupabaseMocks,
  setupFromMocks,
} from '@/test/mocks/supabase';
import { buildSession } from '@/test/builders/session';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { WEATHER_CITY_STORAGE_KEY } from '@/hooks/useWeatherCity';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    localStorage.clear();
    mockNavigate.mockReset();
    mockSession(buildSession());
    mockAuthenticatedUser();
    setupFromMocks({
      plants: { data: [], error: null },
      devices: { data: [], error: null },
    });
  });

  it('shows onboarding steps for a new user', async () => {
    renderWithProviders(<OnboardingChecklist />);

    expect(await screen.findByText('Get started with Plantir')).toBeInTheDocument();
    expect(screen.getByText('Add your first plant')).toBeInTheDocument();
    expect(screen.getByText('Register your first device')).toBeInTheDocument();
    expect(screen.getByText('Set your location')).toBeInTheDocument();
    expect(screen.getByText('Review notification settings')).toBeInTheDocument();
  });

  it('hides checklist when dismissed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingChecklist />);

    await screen.findByText('Get started with Plantir');
    await user.click(screen.getByRole('button', { name: 'Dismiss onboarding' }));

    await waitFor(() => {
      expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
    });
  });

  it('does not render when previously dismissed', () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    renderWithProviders(<OnboardingChecklist />);

    expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
  });

  it('marks completed steps when user has plants and devices', async () => {
    const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    setupFromMocks({
      plants: { data: [{ id: 1, createdAt: recentDate }], error: null },
      devices: { data: [{ id: 1 }], error: null },
    });

    renderWithProviders(<OnboardingChecklist />);

    expect(await screen.findByText(/2 of 4 steps complete/)).toBeInTheDocument();
    expect(screen.getByText('Set your location')).toBeInTheDocument();
    expect(screen.getByText('Review notification settings')).toBeInTheDocument();
  });

  it('hides checklist when all steps are complete', async () => {
    localStorage.setItem('settings_visited', 'true');
    localStorage.setItem(WEATHER_CITY_STORAGE_KEY, JSON.stringify({ name: 'Rome', lat: 41.89, lng: 12.49 }));
    setupFromMocks({
      plants: { data: [{ id: 1, createdAt: '2026-01-01' }], error: null },
      devices: { data: [{ id: 1 }], error: null },
    });

    renderWithProviders(<OnboardingChecklist />);

    await waitFor(() => {
      expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
    });
  });

  it('navigates to the dashboard when the location step is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingChecklist />);

    await screen.findByText('Get started with Plantir');
    await user.click(screen.getByText('Set your location'));

    expect(mockNavigate).toHaveBeenCalledWith('/?setLocation=1');
  });

  it('marks location complete when weather city is stored', async () => {
    const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(WEATHER_CITY_STORAGE_KEY, JSON.stringify({ name: 'Rome', lat: 41.89, lng: 12.49 }));
    setupFromMocks({
      plants: { data: [{ id: 1, createdAt: recentDate }], error: null },
      devices: { data: [{ id: 1 }], error: null },
    });

    renderWithProviders(<OnboardingChecklist />);

    expect(await screen.findByText(/3 of 4 steps complete/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Go' })).toHaveLength(1);
  });

  it('navigates when an incomplete step is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingChecklist />);

    await screen.findByText('Get started with Plantir');
    await user.click(screen.getByText('Add your first plant'));

    expect(mockNavigate).toHaveBeenCalledWith('/plants-center?tab=plants');
  });

  it('navigates when Go button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingChecklist />);

    await screen.findByText('Get started with Plantir');
    const goButtons = screen.getAllByRole('button', { name: 'Go' });
    await user.click(goButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/plants-center?tab=plants');
  });

  it('marks notifications complete when plant is old enough', async () => {
    const oldDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(WEATHER_CITY_STORAGE_KEY, JSON.stringify({ name: 'Rome', lat: 41.89, lng: 12.49 }));
    setupFromMocks({
      plants: { data: [{ id: 1, createdAt: oldDate }], error: null },
      devices: { data: [{ id: 1 }], error: null },
    });

    renderWithProviders(<OnboardingChecklist />);

    await waitFor(() => {
      expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
    });
  });

  it('does not render when user is not authenticated', async () => {
    const { mockUnauthenticated } = await import('@/test/mocks/supabase');
    mockUnauthenticated();

    renderWithProviders(<OnboardingChecklist />);

    await waitFor(() => {
      expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
    });
  });
});
