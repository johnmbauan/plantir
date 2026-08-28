import { Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

export default function AddManualIntro() {
  const { t } = useTranslation();
  return (
    <Text size="sm" c="dimmed">
      {t("deviceForm.manualIntro")}
    </Text>
  );
}
