import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { defaultFormValues } from '@/components/DeviceFormModal/utils';
import AssignmentSection from './AssignmentSection';

const plantOptions = [
  { value: '1', label: 'Monstera' },
  { value: '2', label: 'Ficus' },
];

describe('AssignmentSection', () => {
  it('renders editable serial input in create mode', async () => {
    const user = userEvent.setup();
    const onSerialChange = vi.fn();

    renderWithProviders(
      <AssignmentSection
        isEditing={false}
        form={defaultFormValues()}
        plantOptions={plantOptions}
        validation={{}}
        onSerialChange={onSerialChange}
        onPlantChange={vi.fn()}
      />,
    );

    const serialInput = screen.getByPlaceholderText('e.g. SN-001');
    expect(serialInput).toBeEnabled();

    await user.type(serialInput, 'SN-NEW');

    expect(onSerialChange).toHaveBeenCalled();
  });

  it('shows read-only serial and sensor badge in edit mode', () => {
    renderWithProviders(
      <AssignmentSection
        isEditing
        form={{ ...defaultFormValues(), serialNumber: 'SN-001' }}
        plantOptions={plantOptions}
        validation={{}}
        onSerialChange={vi.fn()}
        onPlantChange={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue('SN-001')).toHaveAttribute('readonly');
    expect(screen.getByText('Humidity sensor')).toBeInTheDocument();
  });

  it('shows serial validation error', () => {
    renderWithProviders(
      <AssignmentSection
        isEditing={false}
        form={defaultFormValues()}
        plantOptions={plantOptions}
        validation={{ serial: 'Serial number is required' }}
        onSerialChange={vi.fn()}
        onPlantChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Serial number is required')).toBeInTheDocument();
  });

  it('shows helper text for plants that already have a device', () => {
    renderWithProviders(
      <AssignmentSection
        isEditing={false}
        form={defaultFormValues()}
        plantOptions={[
          { value: '1', label: 'Monstera', hasDevice: true },
          { value: '2', label: 'Ficus', hasDevice: false },
        ]}
        validation={{}}
        onSerialChange={vi.fn()}
        onPlantChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Plants that already have a device assigned are disabled.'),
    ).toBeInTheDocument();
  });

  it('calls onPlantChange with null when plant is cleared', async () => {
    const user = userEvent.setup();
    const onPlantChange = vi.fn();

    renderWithProviders(
      <AssignmentSection
        isEditing={false}
        form={{ ...defaultFormValues(), plantId: 1 }}
        plantOptions={plantOptions}
        validation={{}}
        onSerialChange={vi.fn()}
        onPlantChange={onPlantChange}
      />,
    );

    // Mantine Select clear button is aria-hidden; query by its aria-label attribute.
    await user.click(screen.getByLabelText('Clear plant'));

    expect(onPlantChange).toHaveBeenCalledWith(null);
  });
});
