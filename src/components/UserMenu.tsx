import { useEffect, useState } from "react";
import { Avatar, Menu, UnstyledButton } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import {
  HEADER_AVATAR_HEIGHT,
  HEADER_AVATAR_WIDTH,
  profileLeafAvatarStyle,
} from "@/pages/profile/leafShape";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { fetchProfile } from "@/services/profileService";
import { profileInitials } from "@/utils/profile";

export default function UserMenu() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const email = session?.user.email;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setNickname(profile.nickname);
        }
      })
      .catch(() => {
        // Avatar falls back to initials; profile page shows load errors.
      });
  }, []);

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) return;
    navigate("/login", { replace: true });
  }

  const initials = profileInitials(nickname, email);
  const leafStyle = profileLeafAvatarStyle(HEADER_AVATAR_WIDTH, HEADER_AVATAR_HEIGHT);

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
          aria-label="Account menu"
          style={{ ...leafStyle, lineHeight: 0, border: "none", padding: 0 }}
        >
          <Avatar
            src={avatarUrl ?? undefined}
            alt="Your profile"
            radius={0}
            w={HEADER_AVATAR_WIDTH}
            h={HEADER_AVATAR_HEIGHT}
            style={leafStyle}
          >
            {initials}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item onClick={() => navigate("/profile")}>Profile</Menu.Item>
        <Menu.Item onClick={() => void handleSignOut()}>Sign out</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
