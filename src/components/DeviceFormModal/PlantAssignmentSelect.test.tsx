import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import PlantAssignmentSelect, {
  renderPlantAssignmentOption,
} from './PlantAssignmentSelect';

describe('renderPlantAssignmentOption', () => {
  it('returns plain label for available plants', () => {
    expect(renderPlantAssignmentOption('Ficus', false)).toBe('Ficus');
  });

  it('renders a device assigned badge for assigned plants', () => {
    renderWithProviders(<>{renderPlantAssignmentOption('Monstera', true)}</>);

    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('device assigned')).toBeInTheDocument();
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
      screen.getByText('Plants that already have a device assigned are disabled.'),
    ).toBeInTheDocument();
  });
});
