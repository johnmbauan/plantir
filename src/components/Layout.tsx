import { AppShell, Group, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  textDecoration: "none",
  fontWeight: 500,
  fontSize: "0.95rem",
  color: isActive ? "var(--terracotta-900)" : "var(--green-500)",
  borderBottom: isActive ? "2px solid var(--terracotta-500)" : "2px solid transparent",
  paddingBottom: "2px",
  transition: "color 0.2s, border-color 0.2s",
});

export default function Layout() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
      styles={{
        main: { background: "transparent", paddingTop: "calc(56px + var(--mantine-spacing-md))" },
        header: {
          background: "var(--terracotta-50)",
          borderBottom: "1px solid var(--terracotta-100)",
          boxShadow: scrolled ? "0 2px 16px rgba(74, 43, 28, 0.1)" : "none",
          transition: "box-shadow 0.3s ease",
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Text fw={700} size="lg" c="var(--green-700)" style={{ letterSpacing: "-0.3px" }}>
            🪴 Plantir
          </Text>
          <Group gap="lg">
            <NavLink to="/" end style={navLinkStyle}>
              Dashboard
            </NavLink>
            <NavLink to="/admin" style={navLinkStyle}>
              Admin
            </NavLink>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
