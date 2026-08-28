import { Stack, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { NICKNAME_MAX_LENGTH } from "@/pages/profile/constants";

interface ProfileIdentityFieldsProps {
  nickname: string;
  email: string;
  loading: boolean;
  onNicknameChange: (value: string) => void;
}

export default function ProfileIdentityFields({
  nickname,
  email,
  loading,
  onNicknameChange,
}: ProfileIdentityFieldsProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <TextInput
        label={t("profile.nickname")}
        placeholder={t("profile.nicknamePlaceholder")}
        description={t("profile.nicknameOptional")}
        value={nickname}
        onChange={(e) => onNicknameChange(e.currentTarget.value)}
        disabled={loading}
        maxLength={NICKNAME_MAX_LENGTH}
      />

      <TextInput
        label={t("profile.email")}
        value={email}
        disabled
        description={t("profile.emailDescription")}
      />
    </Stack>
  );
}
