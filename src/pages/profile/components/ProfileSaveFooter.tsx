import { Button, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface ProfileSaveFooterProps {
  loading: boolean;
  saving: boolean;
}

export default function ProfileSaveFooter({ loading, saving }: ProfileSaveFooterProps) {
  const { t } = useTranslation();

  return (
    <Group justify="flex-end" align="center" wrap="nowrap" gap="md">
      <Button type="submit" loading={saving} disabled={loading} style={{ flexShrink: 0 }}>
        {t("profile.save")}
      </Button>
    </Group>
  );
}
