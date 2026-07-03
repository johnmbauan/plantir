import { Stack, Text, Group, Loader, Code, Button, CopyButton } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
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
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Setup code</Text>
      <Text size="sm">
        Copy this setup code. You will paste it into the device Wi-Fi portal in the next steps.
      </Text>
      {loading ? (
        <Group gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Generating setup code…</Text>
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
                  {copied ? "Copied" : "Copy setup code"}
                </Button>
              )}
            </CopyButton>
            <Text size="xs" c="dimmed">
              Expires at {formatExpiry(pairing.expiresAt)}
            </Text>
          </Group>
        </>
      ) : (
        <Button variant="light" onClick={onGenerate}>
          Generate setup code
        </Button>
      )}
    </Stack>
  );
}
