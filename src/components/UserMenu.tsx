import { useEffect, useState } from "react";
import { Menu, UnstyledButton } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import LeafAvatar from "@/components/LeafAvatar";
import { HEADER_AVATAR_HEIGHT, HEADER_AVATAR_WIDTH } from "@/pages/profile/leafShape";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { ONBOARDING_CHANGED_EVENT } from "@/constants/onboarding";
import { DASHBOARD_PATH } from "@/constants/routes";
import {
  fetchOnboarding,
  isOnboardingRestoreAvailable,
  restoreOnboarding,
} from "@/services/onboardingService";
import { AVATARS_BUCKET, isStorageImageUrl, toThumbnailUrl } from "@/utils/imageVariants";
import { profileInitials } from "@/utils/profile";

export default function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const email = session?.user.email;
  const { nickname, avatarUrl } = useProfile();
  const [showOnboardingItem, setShowOnboardingItem] = useState(false);
  const avatarThumbUrl =
    avatarUrl && isStorageImageUrl(avatarUrl, AVATARS_BUCKET)
      ? (toThumbnailUrl(avatarUrl) ?? avatarUrl)
      : avatarUrl;

  useEffect(() => {
    if (!session) {
      setShowOnboardingItem(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const progress = await fetchOnboarding();
        if (!cancelled) setShowOnboardingItem(isOnboardingRestoreAvailable(progress));
      } catch (err) {
        console.error(err);
        if (!cancelled) setShowOnboardingItem(false);
      }
    }

    void load();
    const onChanged = () => {
      void load();
    };
    window.addEventListener(ONBOARDING_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(ONBOARDING_CHANGED_EVENT, onChanged);
    };
  }, [session]);

  async function handleRestoreOnboarding() {
    try {
      await restoreOnboarding();
      setShowOnboardingItem(false);
      navigate(DASHBOARD_PATH);
    } catch (err) {
      console.error(err);
    }
  }

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
        {showOnboardingItem && (
          <Menu.Item onClick={() => void handleRestoreOnboarding()}>
            {t("userMenu.onboarding")}
          </Menu.Item>
        )}
        <Menu.Item onClick={() => void handleSignOut()}>{t("userMenu.signOut")}</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
