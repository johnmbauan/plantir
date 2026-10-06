import { useEffect, useState } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

const STEP_KEYS = ["send", "timing", "bond", "journal"] as const;

interface Props {
  opened: boolean;
  mode: "intro" | "help";
  onClose: () => void;
  onStartFirst?: () => Promise<void>;
}

export default function MissionHelpModal({ opened, mode, onClose, onStartFirst }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (opened) setStep(0);
  }, [opened]);
  const last = step === STEP_KEYS.length - 1;
  const key = STEP_KEYS[step];

  function resetAndClose() {
    setStep(0);
    onClose();
  }

  async function startFirst() {
    if (!onStartFirst) {
      resetAndClose();
      return;
    }
    setBusy(true);
    try {
      await onStartFirst();
      setStep(0);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={
        <Text fw={700} c="var(--green-700)">
          {t("garden.openHelp")}
        </Text>
      }
      size="md"
      centered
      closeOnClickOutside={false}
      transitionProps={{ duration: 0 }}
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          {t("garden.intro.stepCount", { current: step + 1, total: STEP_KEYS.length })}
        </Text>
        <Text fw={600} c="var(--green-700)">{t(`garden.intro.steps.${key}.title`)}</Text>
        <Text size="sm">
          {t(`garden.intro.steps.${key}.body`, {
            send: t("garden.openMap"),
            journal: t("garden.openJournal"),
            cancel: t("garden.cancelExpedition"),
          })}
        </Text>
        <Group justify="flex-end">
          {mode === "intro" && (
            <Button variant="subtle" onClick={resetAndClose} disabled={busy}>
              {t("garden.intro.skip")}
            </Button>
          )}
          {!last ? (
            <Button onClick={() => setStep((current) => current + 1)}>{t("garden.intro.continue")}</Button>
          ) : mode === "intro" ? (
            <Button onClick={() => void startFirst()} loading={busy}>
              {t("garden.intro.startOuting")}
            </Button>
          ) : (
            <Button onClick={resetAndClose}>{t("garden.intro.done")}</Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
