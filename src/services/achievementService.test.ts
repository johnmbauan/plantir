import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetSupabaseMocks,
  setupFromMocks,
  mockAuthenticatedUser,
  mockUnauthenticated,
  mockInvoke,
} from '@/test/mocks/supabase';

const mockNotificationsShow = vi.fn();

vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockNotificationsShow(...args) },
}));

import {
  fetchAllDefinitions,
  fetchGardenState,
  showUnlockToasts,
  type AchievementDefinition,
} from './achievementService';

const defRow = {
  key: 'hello_my_name_is',
  name: 'Sprout Wars',
  description: 'Create your first plant.',
  garden_element: 'sprout',
  sort_order: 1,
  is_hidden: false,
};

const sproutDef: AchievementDefinition = {
  key: 'hello_my_name_is',
  name: 'Sprout Wars',
  description: 'Create your first plant.',
  garden_element: 'sprout',
  sort_order: 1,
  is_hidden: false,
};

describe('achievementService', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockNotificationsShow.mockReset();
  });

  describe('fetchAllDefinitions', () => {
    it('returns all achievement definitions from the catalog', async () => {
      setupFromMocks({ achievement_definitions: { data: [defRow], error: null } });

      const defs = await fetchAllDefinitions();

      expect(defs).toHaveLength(1);
      expect(defs[0]).toEqual({
        key: 'hello_my_name_is',
        name: 'Sprout Wars',
        description: 'Create your first plant.',
        garden_element: 'sprout',
        sort_order: 1,
        is_hidden: false,
      });
    });

    it('returns multiple definitions preserving order', async () => {
      const rows = [defRow, { ...defRow, key: 'stalking_fern_legally', name: 'Fern Watcher', sort_order: 2 }];
      setupFromMocks({ achievement_definitions: { data: rows, error: null } });

      const defs = await fetchAllDefinitions();

      expect(defs).toHaveLength(2);
      expect(defs[0].key).toBe('hello_my_name_is');
      expect(defs[1].key).toBe('stalking_fern_legally');
    });

    it('returns empty array when catalog has no rows', async () => {
      setupFromMocks({ achievement_definitions: { data: [], error: null } });
      await expect(fetchAllDefinitions()).resolves.toEqual([]);
    });

    it('throws when the database returns an error', async () => {
      setupFromMocks({ achievement_definitions: { data: null, error: new Error('DB error') } });
      await expect(fetchAllDefinitions()).rejects.toThrow('DB error');
    });
  });

  describe('fetchGardenState', () => {
    it('throws when not authenticated', async () => {
      mockUnauthenticated();
      await expect(fetchGardenState()).rejects.toThrow('Not authenticated');
    });

    it('returns earned achievements sorted by sort_order', async () => {
      mockAuthenticatedUser();
      const rows = [
        {
          unlocked_at: '2026-07-01T00:00:00Z',
          achievement_definitions: { ...defRow, key: 'stalking_fern_legally', sort_order: 2 },
        },
        {
          unlocked_at: '2026-07-02T00:00:00Z',
          achievement_definitions: { ...defRow, key: 'hello_my_name_is', sort_order: 1 },
        },
      ];
      setupFromMocks({ user_achievements: { data: rows, error: null } });

      const state = await fetchGardenState();

      expect(state.earned).toHaveLength(2);
      expect(state.earned[0].key).toBe('hello_my_name_is');
      expect(state.earned[1].key).toBe('stalking_fern_legally');
    });
  });

  describe('showUnlockToasts', () => {
    it('shows no toast when the list is empty', () => {
      showUnlockToasts([]);
      expect(mockNotificationsShow).not.toHaveBeenCalled();
    });

    it('shows a single toast using the achievement name as title', () => {
      showUnlockToasts([sproutDef]);

      expect(mockNotificationsShow).toHaveBeenCalledOnce();
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'green',
          title: 'Sprout Wars',
        }),
      );
    });

    it('includes the achievement description in the single-unlock toast message', () => {
      showUnlockToasts([sproutDef]);

      const [call] = mockNotificationsShow.mock.calls;
      expect(call[0].message).toContain('Create your first plant.');
    });

    it('includes a garden call-to-action in the single-unlock toast message', () => {
      showUnlockToasts([sproutDef]);

      const [call] = mockNotificationsShow.mock.calls;
      expect(call[0].message).toContain('Tap to open your garden');
    });

    it('shows a batch toast mentioning badge count for multiple unlocks', () => {
      const second: AchievementDefinition = {
        ...sproutDef,
        key: 'stalking_fern_legally',
        name: 'Fern Watcher',
      };

      showUnlockToasts([sproutDef, second]);

      expect(mockNotificationsShow).toHaveBeenCalledOnce();
      expect(mockNotificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({
          color: 'green',
          title: 'Your garden grew',
          message: expect.stringContaining('2 new badges unlocked'),
        }),
      );
    });

    it('attaches an onClick handler to every toast', () => {
      showUnlockToasts([sproutDef]);

      const [call] = mockNotificationsShow.mock.calls;
      expect(typeof call[0].onClick).toBe('function');
    });

    it('onClick scrolls into view when already on the profile page', () => {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, pathname: '/profile', assign: vi.fn() },
        configurable: true,
      });
      const scrollIntoView = vi.fn();
      document.getElementById = vi.fn(() => ({ scrollIntoView }) as unknown as HTMLElement);

      showUnlockToasts([sproutDef]);
      const [call] = mockNotificationsShow.mock.calls;
      call[0].onClick();

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('onClick navigates to the garden profile path on other pages', () => {
      const assign = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard', assign },
        configurable: true,
      });

      showUnlockToasts([sproutDef]);
      const [call] = mockNotificationsShow.mock.calls;
      call[0].onClick();

      expect(assign).toHaveBeenCalledWith('/profile#garden');
    });
  });
});
