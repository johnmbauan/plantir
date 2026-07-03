import { Stack, Text, Loader, Alert, Button } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

interface Props {
  timedOut: boolean;
  error: string | null;
  onKeepWaiting: () => void;
  onRegenerateCode: () => void;
}

export default function WaitingStep({ timedOut, error, onKeepWaiting, onRegenerateCode }: Props) {
  return (
    <Stack gap="sm" mt="md" align="center">
      <Text fw={600}>Waiting for registration</Text>
      {!timedOut && !error && (
        <>
          <Loader />
          <Text size="sm" ta="center">
            Waiting for the device to register… Keep the portal open until the device connects to your Wi-Fi.
          </Text>
        </>
      )}
      {timedOut && (
        <Alert color="yellow" icon={<IconAlertCircle size={16} />} title="Still waiting">
          <Stack gap="sm">
            <Text size="sm">
              We have not detected registration yet. Check that the setup code was pasted correctly and the device joined your Wi-Fi.
            </Text>
            <Button variant="light" onClick={onKeepWaiting}>
              Keep waiting
            </Button>
            <Button variant="subtle" onClick={onRegenerateCode}>
              Generate a new setup code
            </Button>
          </Stack>
        </Alert>
      )}
      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} title="Error">
          {error}
        </Alert>
      )}
    </Stack>
  );
}
