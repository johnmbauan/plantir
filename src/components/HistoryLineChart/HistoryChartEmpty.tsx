import { Box, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface Props {
  title: string;
}

export default function HistoryChartEmpty({ title }: Props) {
  const { t } = useTranslation();
  return (
    <Box p="sm" style={{ border: "1px dashed var(--mantine-color-gray-4)", borderRadius: 8 }}>
      <Text size="sm" c="dimmed">{t("historyChart.empty", { title })}</Text>
    </Box>
  );
}
