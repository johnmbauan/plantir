import { Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface Props {
  name: string;
  description: string;
  locked: boolean;
  hidden: boolean;
}

export default function GardenInspectPopover({ name, description, locked, hidden }: Props) {
  const { t } = useTranslation();
  if (locked && hidden) {
    return (
      <Stack gap={4}>
        <Text size="sm" fw={600} c="dimmed">
          {t("garden.mysteryName")}
        </Text>
        <Text size="xs" c="dimmed">
          {description}
        </Text>
        <Text size="xs" c="dimmed" fs="italic">
          {t("garden.notYetUnlocked")}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <Text size="sm" fw={600} c={locked ? "dimmed" : "var(--green-700)"}>
        {name}
      </Text>
      <Text size="xs" c="dimmed">
        {description}
      </Text>
      {locked && (
        <Text size="xs" c="dimmed" fs="italic">
          {t("garden.notYetUnlocked")}
        </Text>
      )}
    </Stack>
  );
}
