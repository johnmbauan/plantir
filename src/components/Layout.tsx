import { AppShell, Burger, Group, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import NavDrawer from "@/components/NavDrawer";
import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/context/AuthContext";
import { WeatherCityProvider } from "@/context/WeatherCityContext";

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
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const { session } = useAuth();
  const isAdmin = session?.user.app_metadata?.role === "admin";

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
      <NavDrawer opened={drawerOpened} onClose={closeDrawer} isAdmin={isAdmin} />

      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <UnstyledButton
            component={Link}
            to="/"
            aria-label="Plantir home"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Text fw={700} size="lg" c="var(--green-700)" style={{ letterSpacing: "-0.3px" }}>
              🪴 Plantir
            </Text>
          </UnstyledButton>
          <Group gap="md">
            <NotificationBell />
            <Group gap="lg" visibleFrom="sm">
              <NavLink to="/" end style={navLinkStyle}>
                Dashboard
              </NavLink>
              <NavLink to="/plants-center" style={navLinkStyle}>
                Plants Center
              </NavLink>
              <NavLink to="/settings" style={navLinkStyle}>
                Settings
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" style={navLinkStyle}>
                  Admin
                </NavLink>
              )}
            </Group>
            <UserMenu />
            <Burger
              opened={drawerOpened}
              onClick={openDrawer}
              hiddenFrom="sm"
              aria-label="Toggle navigation"
              color="var(--green-700)"
            />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <WeatherCityProvider>
          <Outlet />
        </WeatherCityProvider>
      </AppShell.Main>
    </AppShell>
  );
}
