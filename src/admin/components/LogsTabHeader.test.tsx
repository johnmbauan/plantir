import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { LogsTabHeader } from '@/admin/components/LogsTabHeader';

const serialOptions = [
  { value: '', label: 'All devices' },
  { value: 'SN-001', label: 'SN-001' },
];

const ownerOptions = [
  { value: '', label: 'All owners' },
  { value: 'alice@example.com', label: 'alice@example.com' },
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

describe('LogsTabHeader', () => {
  it('renders the title and filter controls', () => {
    renderWithProviders(
      <LogsTabHeader
        serialOptions={serialOptions}
        ownerOptions={ownerOptions}
        selectedSerial={null}
        selectedOwner={null}
        selectedLevel={null}
        onSerialChange={vi.fn()}
        onOwnerChange={vi.fn()}
        onLevelChange={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText('Device Logs')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('All devices')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('All owners')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('All levels')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh logs' })).toBeInTheDocument();
  });

  it('calls filter change handlers', async () => {
    const user = userEvent.setup();
    const onSerialChange = vi.fn();
    const onOwnerChange = vi.fn();
    const onLevelChange = vi.fn();

    renderWithProviders(
      <LogsTabHeader
        serialOptions={serialOptions}
        ownerOptions={ownerOptions}
        selectedSerial={null}
        selectedOwner={null}
        selectedLevel={null}
        onSerialChange={onSerialChange}
        onOwnerChange={onOwnerChange}
        onLevelChange={onLevelChange}
        onRefresh={vi.fn()}
      />,
    );

    await selectComboboxOption(user, 0, 'SN-001');
    await selectComboboxOption(user, 1, 'alice@example.com');
    await selectComboboxOption(user, 2, 'Error');

    expect(onSerialChange).toHaveBeenCalledWith('SN-001');
    expect(onOwnerChange).toHaveBeenCalledWith('alice@example.com');
    expect(onLevelChange).toHaveBeenCalledWith('error');
  });

  it('calls onRefresh when refresh is clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    renderWithProviders(
      <LogsTabHeader
        serialOptions={serialOptions}
        ownerOptions={ownerOptions}
        selectedSerial={null}
        selectedOwner={null}
        selectedLevel={null}
        onSerialChange={vi.fn()}
        onOwnerChange={vi.fn()}
        onLevelChange={vi.fn()}
        onRefresh={onRefresh}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh logs' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
