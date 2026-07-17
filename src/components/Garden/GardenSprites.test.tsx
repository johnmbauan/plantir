import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import type { GardenElementId } from '@/constants/achievements';
import { GardenSprite } from './GardenSprites';

const ALL_ELEMENTS: GardenElementId[] = [
  'sprout',
  'sensor_mushroom',
  'vine_link',
  'magnifier',
  'bell_flower',
  'garden_gnome',
  'watering_can',
  'ghost_orchid',
  'battery_bush',
  'clover_cluster',
  'fern_pot',
  'label_stake',
  'camera_sunflower',
  'rain_cloud',
  'mirror_pond',
  'week_wreath',
  'month_sun',
  'phoenix_fern',
  'compost_bin',
  'hourglass_leaf',
  'moon_mushroom',
];

describe('GardenSprite', () => {
  it.each(ALL_ELEMENTS)('renders %s without crashing', (element) => {
    render(
      <MantineProvider>
        <GardenSprite element={element} size={40} />
      </MantineProvider>,
    );
    expect(screen.getByTestId('garden-sprite-svg')).toBeInTheDocument();
  });

  it('renders at the requested size', () => {
    render(
      <MantineProvider>
        <GardenSprite element="sprout" size={64} />
      </MantineProvider>,
    );
    const svg = screen.getByTestId('garden-sprite-svg');
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('uses a default size of 40 when none is provided', () => {
    render(
      <MantineProvider>
        <GardenSprite element="sprout" />
      </MantineProvider>,
    );
    const svg = screen.getByTestId('garden-sprite-svg');
    expect(svg).toHaveAttribute('width', '40');
  });
});
