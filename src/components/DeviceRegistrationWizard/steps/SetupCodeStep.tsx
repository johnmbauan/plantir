import { Stack, Text, Group, Loader, Code, Button, CopyButton } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { PairingBundle } from "@/types";

interface Props {
  pairing: PairingBundle | null;
  loading: boolean;
  onGenerate: () => void;
}

function formatExpiry(expiresAt: string): string {
  return new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function SetupCodeStep({ pairing, loading, onGenerate }: Props) {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>{t("registrationWizard.setupCode.title")}</Text>
      <Text size="sm">
        {t("registrationWizard.setupCode.intro")}
      </Text>
      {loading ? (
        <Group gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">{t("registrationWizard.setupCode.generating")}</Text>
        </Group>
      ) : pairing ? (
        <>
          <Code block style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
            {pairing.bundle}
          </Code>
          <Group gap="sm">
            <CopyButton value={pairing.bundle}>
              {({ copied, copy }) => (
                <Button
                  leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  variant="light"
                  onClick={copy}
                >
                  {copied ? t("registrationWizard.setupCode.copied") : t("registrationWizard.setupCode.copy")}
                </Button>
              )}
            </CopyButton>
            <Text size="xs" c="dimmed">
              {t("registrationWizard.setupCode.expiresAt", { time: formatExpiry(pairing.expiresAt) })}
            </Text>
          </Group>
        </>
      ) : (
        <Button variant="light" onClick={onGenerate}>
          {t("registrationWizard.setupCode.generate")}
        </Button>
      )}
    </Stack>
  );
}
