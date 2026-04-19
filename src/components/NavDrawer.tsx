import { Drawer, Stack, Text, Button } from "@mantine/core";
import { NavLink } from "react-router-dom";

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  textDecoration: "none",
  fontWeight: 500,
  fontSize: "0.95rem",
  color: isActive ? "var(--terracotta-900)" : "var(--green-500)",
  borderBottom: isActive ? "2px solid var(--terracotta-500)" : "2px solid transparent",
  paddingBottom: "2px",
  transition: "color 0.2s, border-color 0.2s",
});

interface Props {
  opened: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export default function NavDrawer({ opened, onClose, onSignOut }: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="xs"
      title={
        <Text fw={700} size="lg" c="var(--green-700)" style={{ letterSpacing: "-0.3px" }}>
          🪴 Plantir
        </Text>
      }
      styles={{ header: { background: "var(--terracotta-50)", borderBottom: "1px solid var(--terracotta-100)" } }}
    >
      <Stack gap="xl" pt="md">
        <NavLink to="/" end style={navLinkStyle} onClick={onClose}>
          Dashboard
        </NavLink>
        <NavLink to="/plants-center" style={navLinkStyle} onClick={onClose}>
          Plants Center
        </NavLink>
        <NavLink to="/settings" style={navLinkStyle} onClick={onClose}>
          Settings
        </NavLink>
        <Button
          variant="subtle"
          color="gray"
          onClick={() => { onSignOut(); onClose(); }}
          style={{ color: "var(--green-500)", justifyContent: "flex-start" }}
        >
          Sign out
        </Button>
      </Stack>
    </Drawer>
  );
}
