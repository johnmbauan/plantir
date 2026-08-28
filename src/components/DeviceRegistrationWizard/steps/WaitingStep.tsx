import { Stack, Text, Loader, Alert, Button } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface Props {
  timedOut: boolean;
  error: string | null;
  onKeepWaiting: () => void;
  onRegenerateCode: () => void;
}

export default function WaitingStep({ timedOut, error, onKeepWaiting, onRegenerateCode }: Props) {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md" align="center">
      <Text fw={600}>{t("registrationWizard.waiting.title")}</Text>
      {!timedOut && !error && (
        <>
          <Loader />
          <Text size="sm" ta="center">
            {t("registrationWizard.waiting.body")}
          </Text>
        </>
      )}
      {timedOut && (
        <Alert color="yellow" icon={<IconAlertCircle size={16} />} title={t("registrationWizard.waiting.stillWaitingTitle")}>
          <Stack gap="sm">
            <Text size="sm">
              {t("registrationWizard.waiting.stillWaitingBody")}
            </Text>
            <Button variant="light" onClick={onKeepWaiting}>
              {t("registrationWizard.waiting.keepWaiting")}
            </Button>
            <Button variant="subtle" onClick={onRegenerateCode}>
              {t("registrationWizard.waiting.regenerateCode")}
            </Button>
          </Stack>
        </Alert>
      )}
      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} title={t("common.error")}>
          {error}
        </Alert>
      )}
    </Stack>
  );
}
