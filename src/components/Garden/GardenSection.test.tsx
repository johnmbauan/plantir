import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import type { AchievementDefinition, EarnedAchievement } from '@/services/achievementService';
import type { UseGardenStateResult } from './useGardenState';
import { GARDEN_TIERS } from '@/constants/achievements';

vi.mock('./useGardenState', () => ({
  useGardenState: vi.fn(),
}));

vi.mock('./GardenScene', () => ({
  default: ({
    allDefinitions,
    earned,
  }: {
    allDefinitions: AchievementDefinition[];
    earned: EarnedAchievement[];
    newlyUnlockedKeys: string[];
    visualStage: string;
  }) => (
    <div
      data-testid="garden-scene"
      data-definitions={allDefinitions.length}
      data-earned={earned.length}
    />
  ),
}));

import GardenSection from './GardenSection';
import { useGardenState } from './useGardenState';

const soilTier = GARDEN_TIERS[0];

const sproutDef: AchievementDefinition = {
  key: 'hello_my_name_is',
  name: 'Sprout Wars',
  description: 'Create your first plant.',
  garden_element: 'sprout',
  sort_order: 1,
  is_hidden: false,
};

const earnedSprout: EarnedAchievement = {
  ...sproutDef,
  unlocked_at: '2026-01-01T00:00:00Z',
};

function baseState(overrides: Partial<UseGardenStateResult> = {}): UseGardenStateResult {
  return {
    loading: false,
    allDefinitions: [sproutDef],
    earned: [],
    earnedCount: 0,
    tier: soilTier,
    newlyUnlockedKeys: [],
    refresh: vi.fn(),
    ...overrides,
  };
}

function renderSection() {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <GardenSection />
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('GardenSection', () => {
  beforeEach(() => {
    vi.mocked(useGardenState).mockReset();
    vi.mocked(useGardenState).mockReturnValue(baseState());
  });

  it('shows a skeleton while loading', () => {
    vi.mocked(useGardenState).mockReturnValue(baseState({ loading: true }));
    const { container } = renderSection();
    // Mantine Skeleton renders as a div with specific class
    expect(container.querySelector('[class*="skeleton"]')).toBeInTheDocument();
  });

  it('renders the garden scene when loaded', () => {
    renderSection();
    expect(screen.getByTestId('garden-scene')).toBeInTheDocument();
  });

  it('passes allDefinitions to GardenScene', () => {
    vi.mocked(useGardenState).mockReturnValue(baseState({ allDefinitions: [sproutDef] }));
    renderSection();
    expect(screen.getByTestId('garden-scene')).toHaveAttribute('data-definitions', '1');
  });

  it('passes earned to GardenScene', () => {
    vi.mocked(useGardenState).mockReturnValue(
      baseState({ allDefinitions: [sproutDef], earned: [earnedSprout], earnedCount: 1 }),
    );
    renderSection();
    expect(screen.getByTestId('garden-scene')).toHaveAttribute('data-earned', '1');
  });

  it('renders the tier name and tagline', () => {
    renderSection();
    // The tier name and tagline are rendered in a single element separated by " — "
    expect(screen.getByText(new RegExp(soilTier.name))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(soilTier.tagline))).toBeInTheDocument();
  });

  it('renders the garden section heading', () => {
    renderSection();
    expect(screen.getByText('Your Garden')).toBeInTheDocument();
  });

  it('scrolls to the garden element when the hash is #garden on load', () => {
    const scrollIntoView = vi.fn();
    const originalGetElementById = document.getElementById.bind(document);
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'garden') return { scrollIntoView } as unknown as HTMLElement;
      return originalGetElementById(id);
    });

    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '#garden' },
      configurable: true,
    });

    renderSection();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '' },
      configurable: true,
    });
    vi.mocked(document.getElementById).mockRestore();
  });
});
