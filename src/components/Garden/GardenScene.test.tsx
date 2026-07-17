import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import type { AchievementDefinition, EarnedAchievement } from '@/services/achievementService';

vi.mock('./GardenElement', () => ({
  default: ({
    definition,
    earned,
    animateIn,
  }: {
    definition: AchievementDefinition;
    earned: boolean;
    animateIn: boolean;
  }) => (
    <div
      data-testid={`garden-element-${definition.key}`}
      data-earned={String(earned)}
      data-animate-in={String(animateIn)}
    />
  ),
}));

import GardenScene from './GardenScene';

const sproutDef: AchievementDefinition = {
  key: 'hello_my_name_is',
  name: 'Sprout Wars',
  description: 'Create your first plant.',
  garden_element: 'sprout',
  sort_order: 1,
  is_hidden: false,
};

const sensorDef: AchievementDefinition = {
  key: 'stalking_fern_legally',
  name: 'Stalking Fern',
  description: 'Connect your first sensor.',
  garden_element: 'sensor_mushroom',
  sort_order: 2,
  is_hidden: false,
};

const earnedSprout: EarnedAchievement = {
  ...sproutDef,
  unlocked_at: '2026-07-01T00:00:00Z',
};

function renderScene(
  props: Partial<{
    allDefinitions: AchievementDefinition[];
    earned: EarnedAchievement[];
    newlyUnlockedKeys: string[];
  }> = {},
) {
  return render(
    <MantineProvider>
      <GardenScene
        visualStage="garden"
        allDefinitions={props.allDefinitions ?? [sproutDef, sensorDef]}
        earned={props.earned ?? [earnedSprout]}
        newlyUnlockedKeys={props.newlyUnlockedKeys ?? []}
      />
    </MantineProvider>,
  );
}

describe('GardenScene', () => {
  describe('renders all definitions', () => {
    it('renders an element for every definition', () => {
      renderScene();

      expect(screen.getByTestId('garden-element-hello_my_name_is')).toBeInTheDocument();
      expect(screen.getByTestId('garden-element-stalking_fern_legally')).toBeInTheDocument();
    });

    it('renders nothing when no definitions are provided', () => {
      renderScene({ allDefinitions: [], earned: [] });

      expect(screen.queryByTestId(/garden-element-/)).not.toBeInTheDocument();
    });
  });

  describe('earned vs locked', () => {
    it('marks earned definitions as earned=true', () => {
      renderScene({ allDefinitions: [sproutDef], earned: [earnedSprout] });

      expect(screen.getByTestId('garden-element-hello_my_name_is')).toHaveAttribute('data-earned', 'true');
    });

    it('marks definitions not in the earned list as earned=false', () => {
      renderScene({ allDefinitions: [sensorDef], earned: [] });

      expect(screen.getByTestId('garden-element-stalking_fern_legally')).toHaveAttribute('data-earned', 'false');
    });

    it('renders a mix of earned and locked elements', () => {
      renderScene({ allDefinitions: [sproutDef, sensorDef], earned: [earnedSprout] });

      expect(screen.getByTestId('garden-element-hello_my_name_is')).toHaveAttribute('data-earned', 'true');
      expect(screen.getByTestId('garden-element-stalking_fern_legally')).toHaveAttribute('data-earned', 'false');
    });
  });

  describe('newly unlocked animation', () => {
    it('sets animateIn=true only for newly unlocked keys', () => {
      renderScene({
        allDefinitions: [sproutDef, sensorDef],
        earned: [earnedSprout, { ...sensorDef, unlocked_at: '2026-07-02T00:00:00Z' }],
        newlyUnlockedKeys: ['hello_my_name_is'],
      });

      expect(screen.getByTestId('garden-element-hello_my_name_is')).toHaveAttribute('data-animate-in', 'true');
      expect(screen.getByTestId('garden-element-stalking_fern_legally')).toHaveAttribute('data-animate-in', 'false');
    });
  });

  describe('visual stage', () => {
    it('applies the correct CSS class for each stage', () => {
      render(
        <MantineProvider>
          <GardenScene
            visualStage="forest"
            allDefinitions={[]}
            earned={[]}
            newlyUnlockedKeys={[]}
          />
        </MantineProvider>,
      );

      expect(screen.getByRole('img', { name: 'Your growing garden' })).toHaveClass('garden-scene--forest');
    });
  });
});
