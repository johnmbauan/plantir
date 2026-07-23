import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { DevicesTabHeader } from '@/admin/components/DevicesTabHeader';

const serialOptions = [
  { value: '', label: 'All devices' },
  { value: 'SN-001', label: 'SN-001' },
];

const ownerOptions = [
  { value: '', label: 'All owners' },
  { value: 'alice@example.com', label: 'alice@example.com' },
];

const plantOptions = [
  { value: '', label: 'All plants' },
  { value: 'Monstera', label: 'Monstera' },
];

async function selectComboboxOption(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  value: string,
) {
  const inputs = screen.getAllByRole('textbox');
  await user.click(inputs[index]);
  const option = await screen.findByRole('option', { name: value, hidden: true });
  await user.click(option);
}

describe('DevicesTabHeader', () => {
  it('renders the title and filter controls', () => {
    renderWithProviders(
      <DevicesTabHeader
        serialOptions={serialOptions}
        ownerOptions={ownerOptions}
        plantOptions={plantOptions}
        selectedSerial={null}
        selectedOwner={null}
        selectedPlant={null}
        onSerialChange={vi.fn()}
        onOwnerChange={vi.fn()}
        onPlantChange={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText('All Devices')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('All devices')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('All owners')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('All plants')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh devices' })).toBeInTheDocument();
  });

  it('calls filter change handlers', async () => {
    const user = userEvent.setup();
    const onSerialChange = vi.fn();
    const onOwnerChange = vi.fn();
    const onPlantChange = vi.fn();

    renderWithProviders(
      <DevicesTabHeader
        serialOptions={serialOptions}
        ownerOptions={ownerOptions}
        plantOptions={plantOptions}
        selectedSerial={null}
        selectedOwner={null}
        selectedPlant={null}
        onSerialChange={onSerialChange}
        onOwnerChange={onOwnerChange}
        onPlantChange={onPlantChange}
        onRefresh={vi.fn()}
      />,
    );

    await selectComboboxOption(user, 0, 'SN-001');
    await selectComboboxOption(user, 1, 'alice@example.com');
    await selectComboboxOption(user, 2, 'Monstera');

    expect(onSerialChange).toHaveBeenCalledWith('SN-001');
    expect(onOwnerChange).toHaveBeenCalledWith('alice@example.com');
    expect(onPlantChange).toHaveBeenCalledWith('Monstera');
  });

  it('calls onRefresh when refresh is clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    renderWithProviders(
      <DevicesTabHeader
        serialOptions={serialOptions}
        ownerOptions={ownerOptions}
        plantOptions={plantOptions}
        selectedSerial={null}
        selectedOwner={null}
        selectedPlant={null}
        onSerialChange={vi.fn()}
        onOwnerChange={vi.fn()}
        onPlantChange={vi.fn()}
        onRefresh={onRefresh}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh devices' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
