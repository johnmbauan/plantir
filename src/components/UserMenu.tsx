import { Menu, UnstyledButton } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import LeafAvatar from "@/components/LeafAvatar";
import { HEADER_AVATAR_HEIGHT, HEADER_AVATAR_WIDTH } from "@/pages/profile/leafShape";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { profileInitials } from "@/utils/profile";

export default function UserMenu() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const email = session?.user.email;
  const { nickname, avatarUrl } = useProfile();

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
          aria-label="Account menu"
          style={{
            width: HEADER_AVATAR_WIDTH,
            height: HEADER_AVATAR_HEIGHT,
            lineHeight: 0,
            border: "none",
            padding: 0,
          }}
        >
          <LeafAvatar size="header" src={avatarUrl} initials={initials} alt="Your profile" />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item onClick={() => navigate("/profile")}>Profile</Menu.Item>
        <Menu.Item onClick={() => void handleSignOut()}>Sign out</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
