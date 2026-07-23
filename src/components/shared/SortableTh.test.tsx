import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Table } from '@mantine/core';
import { renderWithProviders, screen } from '@/test/render';
import { SortableTh } from '@/components/shared/SortableTh';

describe('SortableTh', () => {
  it('calls onSort when clicked', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();

    renderWithProviders(
      <Table>
        <Table.Thead>
          <Table.Tr>
            <SortableTh
              label="Name"
              columnKey="name"
              activeKey="status"
              direction="asc"
              onSort={onSort}
            />
          </Table.Tr>
        </Table.Thead>
      </Table>,
    );

    await user.click(screen.getByRole('button', { name: 'Sort by Name' }));
    expect(onSort).toHaveBeenCalledWith('name');
  });

  it('calls onSort when Enter or Space is pressed', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();

    renderWithProviders(
      <Table>
        <Table.Thead>
          <Table.Tr>
            <SortableTh
              label="Moisture"
              columnKey="moisture"
              activeKey="moisture"
              direction="desc"
              onSort={onSort}
            />
          </Table.Tr>
        </Table.Thead>
      </Table>,
    );

    const button = screen.getByRole('button', { name: 'Sort by Moisture' });
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onSort).toHaveBeenCalledTimes(2);
    expect(onSort).toHaveBeenCalledWith('moisture');
  });
});
