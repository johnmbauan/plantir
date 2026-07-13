import { Drawer, Stack, Text, UnstyledButton } from "@mantine/core";
import { NavLink, Link } from "react-router-dom";

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
  isAdmin?: boolean;
}

export default function NavDrawer({ opened, onClose, isAdmin }: Props) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="xs"
      title={
        <UnstyledButton
          component={Link}
          to="/"
          onClick={onClose}
          aria-label="Plantir home"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Text fw={700} size="lg" c="var(--green-700)" style={{ letterSpacing: "-0.3px" }}>
            🪴 Plantir
          </Text>
        </UnstyledButton>
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
        {isAdmin && (
          <NavLink to="/admin" style={navLinkStyle} onClick={onClose}>
            Admin
          </NavLink>
        )}
      </Stack>
    </Drawer>
  );
}
