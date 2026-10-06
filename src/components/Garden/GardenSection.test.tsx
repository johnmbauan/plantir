import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import type { AchievementDefinition, EarnedAchievement } from '@/services/achievementService';
import { GARDEN_TIERS } from '@/constants/achievements';

vi.mock('./GardenScene', () => ({
  default: ({
    allDefinitions,
    earned,
    travelingKeys,
  }: {
    allDefinitions: AchievementDefinition[];
    earned: EarnedAchievement[];
    newlyUnlockedKeys: string[];
    visualStage: string;
    travelingKeys?: string[];
  }) => (
    <div
      data-testid="garden-scene"
      data-definitions={allDefinitions.length}
      data-earned={earned.length}
      data-traveling={(travelingKeys ?? []).join(',')}
    />
  ),
}));

import GardenSection from './GardenSection';

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

function renderSection(overrides: Partial<ComponentProps<typeof GardenSection>> = {}) {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <GardenSection
          loading={false}
          allDefinitions={[sproutDef]}
          earned={[]}
          tier={soilTier}
          {...overrides}
        />
      </MemoryRouter>
    </MantineProvider>,
  );
}

describe('GardenSection', () => {
  it('shows a skeleton while loading', () => {
    renderSection({ loading: true });
    expect(screen.getByTestId('garden-loading-skeleton')).toBeInTheDocument();
  });

  it('renders the garden scene when loaded', () => {
    renderSection();
    expect(screen.getByTestId('garden-scene')).toBeInTheDocument();
  });

  it('passes allDefinitions to GardenScene', () => {
    renderSection({ allDefinitions: [sproutDef] });
    expect(screen.getByTestId('garden-scene')).toHaveAttribute('data-definitions', '1');
  });

  it('passes earned to GardenScene', () => {
    renderSection({ allDefinitions: [sproutDef], earned: [earnedSprout] });
    expect(screen.getByTestId('garden-scene')).toHaveAttribute('data-earned', '1');
  });

  it('renders the tier name and tagline', () => {
    renderSection();
    expect(screen.getByText(/Seed Packet/)).toBeInTheDocument();
    expect(screen.getByText(/Empty soil/)).toBeInTheDocument();
  });

  it('renders the garden footer', () => {
    renderSection();
    expect(screen.getByText('Keep caring for your plants to grow your garden.')).toBeInTheDocument();
  });

  it('passes travelling creatures to the scene', () => {
    renderSection({ travelingKeys: ['hello_my_name_is'] });
    expect(screen.getByTestId('garden-scene')).toHaveAttribute('data-traveling', 'hello_my_name_is');
  });
});
