import { Menu, UnstyledButton } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import LeafAvatar from "@/components/LeafAvatar";
import { HEADER_AVATAR_HEIGHT, HEADER_AVATAR_WIDTH } from "@/pages/profile/leafShape";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { AVATARS_BUCKET, isStorageImageUrl, toThumbnailUrl } from "@/utils/imageVariants";
import { profileInitials } from "@/utils/profile";

export default function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const email = session?.user.email;
  const { nickname, avatarUrl } = useProfile();
  const avatarThumbUrl =
    avatarUrl && isStorageImageUrl(avatarUrl, AVATARS_BUCKET)
      ? (toThumbnailUrl(avatarUrl) ?? avatarUrl)
      : avatarUrl;

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) return;
    navigate("/login", { replace: true });
  }

  const initials = profileInitials(nickname, email);

  return (
    <Menu
      trigger="hover"
      openDelay={100}
      closeDelay={150}
      position="bottom-end"
      shadow="md"
      width={160}
    >
      <Menu.Target>
        <UnstyledButton
          aria-label={t("userMenu.accountMenuAria")}
          style={{
            width: HEADER_AVATAR_WIDTH,
            height: HEADER_AVATAR_HEIGHT,
            lineHeight: 0,
            border: "none",
            padding: 0,
          }}
        >
          <LeafAvatar size="header" src={avatarThumbUrl} initials={initials} alt={t("userMenu.yourProfileAlt")} />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item onClick={() => navigate("/profile")}>{t("userMenu.profile")}</Menu.Item>
        <Menu.Item onClick={() => void handleSignOut()}>{t("userMenu.signOut")}</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
