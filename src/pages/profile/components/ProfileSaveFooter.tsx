import { Button, Group } from "@mantine/core";

interface ProfileSaveFooterProps {
  loading: boolean;
  saving: boolean;
}

export default function ProfileSaveFooter({ loading, saving }: ProfileSaveFooterProps) {
  return (
    <Group justify="flex-end" align="center" wrap="nowrap" gap="md">
      <Button type="submit" loading={saving} disabled={loading} style={{ flexShrink: 0 }}>
        Save
      </Button>
    </Group>
  );
}
