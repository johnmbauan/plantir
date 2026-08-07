import { Stack, TextInput } from "@mantine/core";
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
  return (
    <Stack gap="md">
      <TextInput
        label="Nickname"
        placeholder="How should we call you?"
        description="Optional"
        value={nickname}
        onChange={(e) => onNicknameChange(e.currentTarget.value)}
        disabled={loading}
        maxLength={NICKNAME_MAX_LENGTH}
      />

      <TextInput
        label="Email"
        value={email}
        disabled
        description="Managed through your account administrator."
      />
    </Stack>
  );
}
