import { Stack, Text, Button } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface Props {
  onRetry: () => void;
}

export default function CalibrationExpiredPrompt({ onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <Stack gap="xs" mt="xs">
      <Text size="sm" c="orange" fw={500}>
        {t("calibrationWizard.expired.message")}
      </Text>
      <Button variant="default" size="sm" onClick={onRetry}>
        {t("calibrationWizard.expired.restart")}
      </Button>
    </Stack>
  );
}
