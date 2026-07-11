import { describe, it, expect } from 'vitest';
import { Table } from '@mantine/core';
import { renderWithProviders, screen } from '@/test/render';
import { TableLoadingRows } from '@/admin/components/TableLoadingRows';

function renderRows(rowCount: number, columnCount: number) {
  renderWithProviders(
    <Table>
      <Table.Tbody>
        <TableLoadingRows rowCount={rowCount} columnCount={columnCount} />
      </Table.Tbody>
    </Table>,
  );
}

describe('TableLoadingRows', () => {
  it('renders the requested number of skeleton rows and cells', () => {
    renderRows(3, 4);

    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getAllByRole('cell')).toHaveLength(12);
  });
});
