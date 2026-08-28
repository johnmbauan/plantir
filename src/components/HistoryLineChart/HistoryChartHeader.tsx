import { Group, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { formatValue } from "./utils";

interface Props {
  title: string;
  latest: number;
  min: number;
  max: number;
  unit: string;
}

export default function HistoryChartHeader({ title, latest, min, max, unit }: Props) {
  const { t } = useTranslation();
  return (
    <Group justify="space-between" mb="xs">
      <Text size="sm" fw={600}>{title}</Text>
      <Text size="xs" c="dimmed">
        {t("historyChart.headerStats", {
          latest: formatValue(latest, unit),
          min: formatValue(min, unit),
          max: formatValue(max, unit),
        })}
      </Text>
    </Group>
  );
}
