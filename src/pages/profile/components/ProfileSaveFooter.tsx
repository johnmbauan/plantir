import { Button, Group, Paper } from "@mantine/core";
import { stickyFooterStyle } from "@/pages/profile/constants";

interface ProfileSaveFooterProps {
  loading: boolean;
  saving: boolean;
}

export default function ProfileSaveFooter({ loading, saving }: ProfileSaveFooterProps) {
  return (
    <Paper shadow="xs" radius="md" p="lg" style={stickyFooterStyle}>
      <Group justify="flex-end" align="center" wrap="nowrap" gap="md">
        <Button type="submit" loading={saving} disabled={loading} style={{ flexShrink: 0 }}>
          Save
        </Button>
      </Group>
    </Paper>
  );
}
