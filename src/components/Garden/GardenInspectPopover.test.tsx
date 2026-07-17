import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import GardenInspectPopover from './GardenInspectPopover';

describe('GardenInspectPopover', () => {
  describe('earned badge', () => {
    it('shows the achievement name', () => {
      renderWithProviders(<GardenInspectPopover name="Sprout Wars" description="Create your first plant." locked={false} hidden={false} />);
      expect(screen.getByText('Sprout Wars')).toBeInTheDocument();
    });

    it('shows the achievement description', () => {
      renderWithProviders(<GardenInspectPopover name="Sprout Wars" description="Create your first plant." locked={false} hidden={false} />);
      expect(screen.getByText('Create your first plant.')).toBeInTheDocument();
    });

    it('does not show a locked note', () => {
      renderWithProviders(<GardenInspectPopover name="Sprout Wars" description="Create your first plant." locked={false} hidden={false} />);
      expect(screen.queryByText('Not yet unlocked')).not.toBeInTheDocument();
    });
  });

  describe('visible locked badge', () => {
    it('shows the achievement name', () => {
      renderWithProviders(<GardenInspectPopover name="Sprout Wars" description="Create your first plant." locked={true} hidden={false} />);
      expect(screen.getByText('Sprout Wars')).toBeInTheDocument();
    });

    it('shows the achievement description', () => {
      renderWithProviders(<GardenInspectPopover name="Sprout Wars" description="Create your first plant." locked={true} hidden={false} />);
      expect(screen.getByText('Create your first plant.')).toBeInTheDocument();
    });

    it('shows a "Not yet unlocked" note', () => {
      renderWithProviders(<GardenInspectPopover name="Sprout Wars" description="Create your first plant." locked={true} hidden={false} />);
      expect(screen.getByText('Not yet unlocked')).toBeInTheDocument();
    });
  });

  describe('hidden locked badge', () => {
    it('shows "???" as the title instead of the real name', () => {
      renderWithProviders(<GardenInspectPopover name="Secret Badge" description="Water the plant." locked={true} hidden={true} />);
      expect(screen.getByText('???')).toBeInTheDocument();
    });

    it('does not reveal the real badge name', () => {
      renderWithProviders(<GardenInspectPopover name="Secret Badge" description="Water the plant." locked={true} hidden={true} />);
      expect(screen.queryByText('Secret Badge')).not.toBeInTheDocument();
    });

    it('shows the description so users know what they need to do', () => {
      renderWithProviders(<GardenInspectPopover name="Secret Badge" description="Water the plant." locked={true} hidden={true} />);
      expect(screen.getByText('Water the plant.')).toBeInTheDocument();
    });

    it('shows a "Not yet unlocked" note', () => {
      renderWithProviders(<GardenInspectPopover name="Secret Badge" description="Water the plant." locked={true} hidden={true} />);
      expect(screen.getByText('Not yet unlocked')).toBeInTheDocument();
    });
  });
});
