import '@/test/mocks/supabase';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import {
  mockAuthenticatedUser,
  mockSession,
  resetSupabaseMocks,
} from '@/test/mocks/supabase';
import { buildSession } from '@/test/builders/session';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { ONBOARDING_CHANGED_EVENT } from '@/constants/onboarding';
import { EMPTY_ONBOARDING } from '@/services/onboardingService';

const fetchOnboarding = vi.fn();
const dismissOnboarding = vi.fn();
const skipOnboardingStep = vi.fn();

vi.mock('@/services/onboardingService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/onboardingService')>();
  return {
    ...actual,
    fetchOnboarding: (...args: unknown[]) => fetchOnboarding(...args),
    dismissOnboarding: (...args: unknown[]) => dismissOnboarding(...args),
    skipOnboardingStep: (...args: unknown[]) => skipOnboardingStep(...args),
  };
});

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderChecklist() {
  return renderWithProviders(<OnboardingChecklist />);
}

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    localStorage.clear();
    mockNavigate.mockReset();
    fetchOnboarding.mockReset();
    dismissOnboarding.mockReset();
    skipOnboardingStep.mockReset();
    fetchOnboarding.mockResolvedValue({ ...EMPTY_ONBOARDING });
    dismissOnboarding.mockResolvedValue(undefined);
    skipOnboardingStep.mockResolvedValue(undefined);
    mockSession(buildSession());
    mockAuthenticatedUser();
  });

  it('shows onboarding steps for a new user', async () => {
    renderChecklist();

    expect(await screen.findByText('Get started with Plantir')).toBeInTheDocument();
    expect(screen.getByText('Add your first plant')).toBeInTheDocument();
    expect(screen.getByText('Register your first sensor')).toBeInTheDocument();
    expect(screen.getByText('Set your location')).toBeInTheDocument();
    expect(screen.getByText('Review notification settings')).toBeInTheDocument();
    expect(
      screen.getByText('0 of 4 steps complete — follow the guide to start monitoring your plants.'),
    ).toBeInTheDocument();
  });

  it('hides checklist when dismissed', async () => {
    const user = userEvent.setup();
    renderChecklist();

    await screen.findByText('Get started with Plantir');
    await user.click(screen.getByRole('button', { name: 'Dismiss onboarding' }));

    await waitFor(() => {
      expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
    });
    expect(dismissOnboarding).toHaveBeenCalledTimes(1);
  });

  it('does not render when previously dismissed', async () => {
    fetchOnboarding.mockResolvedValue({
      ...EMPTY_ONBOARDING,
      dismissedAt: '2026-08-30T00:00:00Z',
    });
    renderChecklist();

    await waitFor(() => {
      expect(fetchOnboarding).toHaveBeenCalled();
    });
    expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
  });

  it('marks completed steps from saved onboarding progress', async () => {
    fetchOnboarding.mockResolvedValue({
      ...EMPTY_ONBOARDING,
      completedPlantsAt: '2026-08-30T00:00:00Z',
      completedDevicesAt: '2026-08-30T00:00:00Z',
    });

    renderChecklist();

    expect(
      await screen.findByText('2 of 4 steps complete — follow the guide to start monitoring your plants.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Set your location')).toBeInTheDocument();
    expect(screen.getByText('Review notification settings')).toBeInTheDocument();
    expect(screen.getByText('Add your first plant')).toHaveStyle({ textDecoration: 'line-through' });
    expect(screen.getAllByRole('button', { name: 'Go' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Skip for now' })).toHaveLength(2);
  });

  it('keeps a step complete after the related record is gone', async () => {
    fetchOnboarding.mockResolvedValue({
      ...EMPTY_ONBOARDING,
      completedPlantsAt: '2026-08-29T00:00:00Z',
    });

    renderChecklist();

    expect(
      await screen.findByText('1 of 4 steps complete — follow the guide to start monitoring your plants.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Register your first sensor')).toBeInTheDocument();
    expect(screen.getByText('Add your first plant')).toHaveStyle({ textDecoration: 'line-through' });
    expect(screen.getAllByRole('button', { name: 'Go' })).toHaveLength(3);
  });

  it('hides checklist when all steps are complete', async () => {
    fetchOnboarding.mockResolvedValue({
      ...EMPTY_ONBOARDING,
      completedPlantsAt: '2026-08-01T00:00:00Z',
      completedDevicesAt: '2026-08-01T00:00:00Z',
      completedLocationAt: '2026-08-01T00:00:00Z',
      completedNotificationsAt: '2026-08-01T00:00:00Z',
    });

    renderChecklist();

    await waitFor(() => {
      expect(fetchOnboarding).toHaveBeenCalled();
    });
    expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
  });

  it('navigates to the dashboard when the location step is clicked', async () => {
    const user = userEvent.setup();
    renderChecklist();

    await screen.findByText('Get started with Plantir');
    await user.click(screen.getByText('Set your location'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard?setLocation=1');
  });

  it('reloads progress when onboarding changes', async () => {
    fetchOnboarding
      .mockResolvedValueOnce({ ...EMPTY_ONBOARDING })
      .mockResolvedValueOnce({
        ...EMPTY_ONBOARDING,
        completedLocationAt: '2026-08-30T00:00:00Z',
      });

    renderChecklist();
    expect(
      await screen.findByText('0 of 4 steps complete — follow the guide to start monitoring your plants.'),
    ).toBeInTheDocument();

    window.dispatchEvent(new Event(ONBOARDING_CHANGED_EVENT));

    expect(
      await screen.findByText('1 of 4 steps complete — follow the guide to start monitoring your plants.'),
    ).toBeInTheDocument();
  });

  it('navigates when an incomplete step is clicked', async () => {
    const user = userEvent.setup();
    renderChecklist();

    await screen.findByText('Get started with Plantir');
    await user.click(screen.getByText('Add your first plant'));

    expect(mockNavigate).toHaveBeenCalledWith('/plants-center?tab=plants');
  });

  it('navigates when Go button is clicked', async () => {
    const user = userEvent.setup();
    renderChecklist();

    await screen.findByText('Get started with Plantir');
    const goButtons = screen.getAllByRole('button', { name: 'Go' });
    await user.click(goButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/plants-center?tab=plants');
  });

  it('does not render when user is not authenticated', async () => {
    const { mockUnauthenticated } = await import('@/test/mocks/supabase');
    mockSession(null);
    mockUnauthenticated();

    renderChecklist();

    await waitFor(() => {
      expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
    });
    expect(fetchOnboarding).not.toHaveBeenCalled();
  });

  it('stays hidden when progress fails to load', async () => {
    fetchOnboarding.mockRejectedValue(new Error('Load failed'));
    renderChecklist();

    await waitFor(() => {
      expect(fetchOnboarding).toHaveBeenCalled();
    });
    expect(screen.queryByText('Get started with Plantir')).not.toBeInTheDocument();
  });

  it('offers skip only on location and notifications', async () => {
    renderChecklist();

    await screen.findByText('Get started with Plantir');
    expect(screen.getAllByRole('button', { name: 'Skip for now' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Go' })).toHaveLength(4);
  });

  it('hides a skipped step without counting it as complete', async () => {
    const user = userEvent.setup();
    renderChecklist();

    await screen.findByText('Get started with Plantir');
    const skipButtons = screen.getAllByRole('button', { name: 'Skip for now' });
    await user.click(skipButtons[0]);

    expect(skipOnboardingStep).toHaveBeenCalledWith('location');
    expect(screen.queryByText('Set your location')).not.toBeInTheDocument();
    expect(screen.getByText('Review notification settings')).toBeInTheDocument();
    expect(
      screen.getByText('0 of 4 steps complete — follow the guide to start monitoring your plants.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Skip for now' }));

    expect(skipOnboardingStep).toHaveBeenCalledWith('notifications');
    expect(screen.queryByText('Review notification settings')).not.toBeInTheDocument();
  });

  it('does not show a skipped step from saved progress', async () => {
    fetchOnboarding.mockResolvedValue({
      ...EMPTY_ONBOARDING,
      skippedLocationAt: '2026-08-30T00:00:00Z',
    });

    renderChecklist();

    expect(await screen.findByText('Get started with Plantir')).toBeInTheDocument();
    expect(screen.queryByText('Set your location')).not.toBeInTheDocument();
    expect(screen.getByText('Review notification settings')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Skip for now' })).toHaveLength(1);
  });
});
