import { Button, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAdjustments, IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface Props {
  showCalibrate: boolean;
  onCalibrate: () => void;
  onDone: () => void;
}

export default function CreatedDeviceSuccess({ showCalibrate, onCalibrate, onDone }: Props) {
  const { t } = useTranslation();
  return (
    <Stack gap="md" align="center" py="sm">
      <ThemeIcon radius="xl" size="xl" color="green" variant="light">
        <IconCheck size={24} />
      </ThemeIcon>
      <Text size="sm" c="dimmed" ta="center">
        {t("deviceForm.calibratePrompt")}
      </Text>
      <Group gap="xs" justify="center">
        {showCalibrate && (
          <Button
            variant="light"
            leftSection={<IconAdjustments size={16} />}
            onClick={onCalibrate}
          >
            {t("deviceForm.calibrateNow")}
          </Button>
        )}
        <Button variant="default" onClick={onDone}>
          {t("common.done")}
        </Button>
      </Group>
    </Stack>
  );
}
