import { Box, Text } from "@mantine/core";

interface Props {
  title: string;
}

export default function HistoryChartEmpty({ title }: Props) {
  return (
    <Box p="sm" style={{ border: "1px dashed var(--mantine-color-gray-4)", borderRadius: 8 }}>
      <Text size="sm" c="dimmed">{title}: no measurements in this time range.</Text>
    </Box>
  );
}
