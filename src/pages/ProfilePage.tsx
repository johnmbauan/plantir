import { useEffect, useRef, useState } from "react";
import { Box, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import ProfilePhotoModal from "@/components/ProfilePhotoModal";
import ProfileAvatarSection from "@/pages/profile/components/ProfileAvatarSection";
import ProfileIdentityFields from "@/pages/profile/components/ProfileIdentityFields";
import ProfileSaveFooter from "@/pages/profile/components/ProfileSaveFooter";
import GardenSection from "@/components/Garden/GardenSection";
import { cardStyle, NICKNAME_MAX_LENGTH } from "@/pages/profile/constants";
import { useProfileAvatarPreview } from "@/pages/profile/hooks/useProfileAvatarPreview";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import {
  deleteAvatar,
  uploadAvatar,
  upsertProfile,
} from "@/services/profileService";
import { getErrorMessage } from "@/utils/error";
import { profileInitials } from "@/utils/profile";

export default function ProfilePage() {
  const { session } = useAuth();
  const email = session?.user.email ?? "";
  const {
    nickname: savedNickname,
    avatarUrl: contextAvatarUrl,
    loading: profileLoading,
    error: profileError,
    setLocalProfile,
  } = useProfile();

  const [nickname, setNickname] = useState("");
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarExpanded, setAvatarExpanded] = useState(false);
  const hydratedRef = useRef(false);

  const resetFileRef = useRef<(() => void) | null>(null);
  const previewSrc = useProfileAvatarPreview(avatarFile, savedAvatarUrl, avatarRemoved);

  useEffect(() => {
    if (profileLoading || hydratedRef.current) return;
    hydratedRef.current = true;
    setNickname(savedNickname ?? "");
    setSavedAvatarUrl(contextAvatarUrl);
    setLoading(false);
  }, [profileLoading, savedNickname, contextAvatarUrl]);

  useEffect(() => {
    if (!profileError) return;
    notifications.show({ color: "red", title: "Error", message: profileError });
  }, [profileError]);

  function handleFileChange(file: File | null) {
    setAvatarFile(file);
    if (file) setAvatarRemoved(false);
  }

  function handleRemovePhoto() {
    setAvatarFile(null);
    setAvatarRemoved(true);
    resetFileRef.current?.();
  }

  function handleNicknameChange(value: string) {
    setNickname(value.slice(0, NICKNAME_MAX_LENGTH));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const trimmedNickname = nickname.trim().slice(0, NICKNAME_MAX_LENGTH) || null;
    const previousAvatarUrl = savedAvatarUrl;
    let finalAvatarUrl: string | null = avatarRemoved ? null : savedAvatarUrl;

    try {
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(avatarFile);
      }

      await upsertProfile(trimmedNickname, finalAvatarUrl);

      setSavedAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      setAvatarRemoved(false);
      resetFileRef.current?.();
      setLocalProfile({ nickname: trimmedNickname, avatar_url: finalAvatarUrl });

      if (previousAvatarUrl && previousAvatarUrl !== finalAvatarUrl) {
        void deleteAvatar(previousAvatarUrl);
      }

      notifications.show({ color: "green", title: "Saved", message: "Profile updated." });
    } catch (err) {
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  const showRemovePhoto = Boolean(previewSrc);
  const initials = profileInitials(nickname, email);

  return (
    <Box p="md" maw={720} mx="auto" w="100%">
      <Title order={2} c="var(--green-700)" mb="md">
        Profile
      </Title>

      <form onSubmit={handleSubmit}>
        <Paper shadow="xs" radius="md" p="lg" style={cardStyle}>
          <Stack gap="lg">
            <Text size="sm" c="dimmed">
              Set how you appear in Plantir.
            </Text>

            <Group align="flex-start" wrap="wrap" gap="xl">
              <ProfileAvatarSection
                previewSrc={previewSrc}
                initials={initials}
                avatarFile={avatarFile}
                showRemovePhoto={showRemovePhoto}
                loading={loading}
                saving={saving}
                resetFileRef={resetFileRef}
                onExpand={() => setAvatarExpanded(true)}
                onFileChange={handleFileChange}
                onRemovePhoto={handleRemovePhoto}
              />

              <Box flex={1} miw={240} maw="100%">
                <ProfileIdentityFields
                  nickname={nickname}
                  email={email}
                  loading={loading}
                  onNicknameChange={handleNicknameChange}
                />
              </Box>
            </Group>

            <ProfileSaveFooter loading={loading} saving={saving} />
          </Stack>
        </Paper>
      </form>

      <Box mt="md">
        <GardenSection />
      </Box>

      <ProfilePhotoModal
        opened={avatarExpanded}
        onClose={() => setAvatarExpanded(false)}
        src={previewSrc}
      />
    </Box>
  );
}
