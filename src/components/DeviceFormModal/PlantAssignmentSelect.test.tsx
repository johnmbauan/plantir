import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import PlantAssignmentSelect from './PlantAssignmentSelect';
import { renderPlantAssignmentOption } from './renderPlantAssignmentOption';

describe('renderPlantAssignmentOption', () => {
  it('returns plain label for available plants', () => {
    expect(renderPlantAssignmentOption('Ficus', false, 'sensor assigned')).toBe('Ficus');
  });

  it('renders a sensor assigned badge for assigned plants', () => {
    renderWithProviders(<>{renderPlantAssignmentOption('Monstera', true, 'sensor assigned')}</>);

    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('sensor assigned')).toBeInTheDocument();
  });
});

describe('PlantAssignmentSelect', () => {
  it('shows helper text when assigned plants exist', () => {
    renderWithProviders(
      <PlantAssignmentSelect
        label="Plant"
        plantOptions={[
          { value: '1', label: 'Monstera', hasDevice: true },
          { value: '2', label: 'Ficus', hasDevice: false },
        ]}
      />,
    );

    expect(
      screen.getByText('Plants that already have a sensor assigned are disabled.'),
    ).toBeInTheDocument();
  });
});
