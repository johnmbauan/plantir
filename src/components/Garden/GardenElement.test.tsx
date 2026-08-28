import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import type { AchievementDefinition } from '@/services/achievementService';

vi.mock('./GardenSprites', () => ({
  GardenSprite: () => <div data-testid="garden-sprite" />,
  MysterySprite: () => <div data-testid="mystery-sprite" />,
}));

vi.mock('./GardenInspectPopover', () => ({
  default: ({ name, locked }: { name: string; locked: boolean }) => (
    <div data-testid="popover-content" data-locked={locked}>
      {name}
    </div>
  ),
}));

import GardenElement from './GardenElement';

const sproutDef: AchievementDefinition = {
  key: 'hello_my_name_is',
  name: 'Sprout Wars',
  description: 'Create your first plant.',
  garden_element: 'sprout',
  sort_order: 1,
  is_hidden: false,
};

const hiddenDef: AchievementDefinition = {
  key: 'seven_days_without_drama',
  name: 'Seven Happy Days',
  description: 'Keep all monitored plants healthy for 7 days in a row.',
  garden_element: 'week_wreath',
  sort_order: 200,
  is_hidden: true,
};

function renderElement(props: { definition?: AchievementDefinition; earned?: boolean; animateIn?: boolean } = {}) {
  return render(
    <MantineProvider>
      <GardenElement
        definition={props.definition ?? sproutDef}
        earned={props.earned ?? true}
        animateIn={props.animateIn}
      />
    </MantineProvider>,
  );
}

describe('GardenElement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders a button with an accessible label from the achievement', () => {
      renderElement();
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Sprout Wars: A New Leaf: Create your first plant.',
      );
    });

    it('renders the regular sprite for a visible badge', () => {
      renderElement();
      expect(screen.getByTestId('garden-sprite')).toBeInTheDocument();
      expect(screen.queryByTestId('mystery-sprite')).not.toBeInTheDocument();
    });

    it('renders the mystery sprite for a hidden locked badge', () => {
      renderElement({ definition: hiddenDef, earned: false });
      expect(screen.getByTestId('mystery-sprite')).toBeInTheDocument();
      expect(screen.queryByTestId('garden-sprite')).not.toBeInTheDocument();
    });

    it('uses a non-revealing aria-label for hidden locked badges', () => {
      renderElement({ definition: hiddenDef, earned: false });
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Mystery badge: Keep all monitored plants healthy for 7 days in a row.',
      );
      expect(button.getAttribute('aria-label')).not.toContain('Seven Happy Days');
    });

    it('still renders the regular sprite when a hidden badge is earned', () => {
      renderElement({ definition: hiddenDef, earned: true });
      expect(screen.getByTestId('garden-sprite')).toBeInTheDocument();
      expect(screen.queryByTestId('mystery-sprite')).not.toBeInTheDocument();
    });

    it('positions the element using inline styles from GARDEN_LAYOUT', () => {
      renderElement();
      const button = screen.getByRole('button');
      expect(button.style.left).toBeTruthy();
      expect(button.style.top).toBeTruthy();
    });
  });

  describe('CSS classes', () => {
    it('always has the base garden-element class', () => {
      renderElement();
      expect(screen.getByRole('button')).toHaveClass('garden-element');
    });

    it('does not apply the --locked modifier when earned', () => {
      renderElement({ earned: true });
      expect(screen.getByRole('button')).not.toHaveClass('garden-element--locked');
    });

    it('applies the --locked modifier when not earned', () => {
      renderElement({ earned: false });
      expect(screen.getByRole('button')).toHaveClass('garden-element--locked');
    });

    it('applies the --grow modifier when animateIn is true', () => {
      renderElement({ animateIn: true });
      expect(screen.getByRole('button')).toHaveClass('garden-element--grow');
    });

    it('does not apply --grow when animateIn is false', () => {
      renderElement({ animateIn: false });
      expect(screen.getByRole('button')).not.toHaveClass('garden-element--grow');
    });
  });

  describe('hover interaction', () => {
    it('shows the popover content when the button is hovered', async () => {
      const user = userEvent.setup();
      renderElement();

      await user.hover(screen.getByRole('button'));

      expect(await screen.findByTestId('popover-content')).toHaveTextContent(
        'Sprout Wars: A New Leaf',
      );
    });

    it('passes locked=false to the popover for earned badges', async () => {
      const user = userEvent.setup();
      renderElement({ earned: true });

      await user.hover(screen.getByRole('button'));

      const content = await screen.findByTestId('popover-content');
      expect(content).toHaveAttribute('data-locked', 'false');
    });

    it('passes locked=true to the popover for locked badges', async () => {
      const user = userEvent.setup();
      renderElement({ earned: false });

      await user.hover(screen.getByRole('button'));

      const content = await screen.findByTestId('popover-content');
      expect(content).toHaveAttribute('data-locked', 'true');
    });

    it('hides the popover after the cursor leaves', async () => {
      const user = userEvent.setup();
      renderElement();

      const button = screen.getByRole('button');
      await user.hover(button);
      await screen.findByTestId('popover-content');

      await user.unhover(button);

      await waitFor(() => {
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
      });
    });

    it('shows the popover on focus and hides it on blur', async () => {
      const user = userEvent.setup();
      renderElement();

      const button = screen.getByRole('button');
      await user.tab();
      expect(button).toHaveFocus();
      expect(await screen.findByTestId('popover-content')).toBeInTheDocument();

      await user.tab();

      await waitFor(() => {
        expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();
      });
    });
  });
});
