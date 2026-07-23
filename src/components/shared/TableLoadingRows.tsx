import { Skeleton, Table } from "@mantine/core";

interface TableLoadingRowsProps {
  rowCount: number;
  columnCount: number;
}

export function TableLoadingRows({ rowCount, columnCount }: TableLoadingRowsProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <Table.Tr key={rowIndex}>
          {Array.from({ length: columnCount }).map((__, columnIndex) => (
            <Table.Td key={columnIndex}>
              <Skeleton height={14} radius="sm" />
            </Table.Td>
          ))}
        </Table.Tr>
      ))}
    </>
  );
}
