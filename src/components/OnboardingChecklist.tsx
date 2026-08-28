import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Paper, Stack, Group, Text, ThemeIcon, ActionIcon, Button } from "@mantine/core";
import {
  IconCheck,
  IconLeaf,
  IconCpu,
  IconBell,
  IconMapPin,
  IconX,
  IconChevronRight,
} from "@tabler/icons-react";
import type { EnrichedPlant } from "@/types";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { useWeatherCity } from "@/context/WeatherCityContext";

const DISMISSED_KEY = "onboarding_dismissed";
const SETTINGS_VISITED_KEY = "settings_visited";
const SETTINGS_IMPLICIT_DAYS = 3;

interface Props {
  plants: EnrichedPlant[];
  plantsLoaded: boolean;
}

interface ChecklistStep {
  key: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

export default function OnboardingChecklist({ plants, plantsLoaded }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { city } = useWeatherCity();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "true");
  const [hasDevices, setHasDevices] = useState(false);
  const [devicesLoaded, setDevicesLoaded] = useState(false);
  // Capture once at mount — Date.now() during render violates react-hooks/purity.
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    if (dismissed || !user) return;

    const userId = user.id;
    let cancelled = false;

    async function checkDevices() {
      // Devices may exist without a plant association, so query devices directly.
      const { data } = await supabase
        .from("devices")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (cancelled) return;
      setHasDevices((data?.length ?? 0) > 0);
      setDevicesLoaded(true);
    }

    void checkDevices();
    return () => {
      cancelled = true;
    };
  }, [dismissed, user]);

  const hasLocation = city !== null;
  const hasPlants = plantsLoaded && plants.length > 0;

  const oldestPlantDate = plants.length > 0
    ? plants.reduce((oldest, p) => (p.created_at < oldest ? p.created_at : oldest), plants[0].created_at)
    : null;
  const plantIsOldEnough = oldestPlantDate !== null
    && nowMs - new Date(oldestPlantDate).getTime() >= SETTINGS_IMPLICIT_DAYS * 24 * 60 * 60 * 1000;
  const hasNotifications = localStorage.getItem(SETTINGS_VISITED_KEY) === "true"
    || (hasPlants && hasDevices && plantIsOldEnough);

  const steps: ChecklistStep[] = [
    {
      key: "plants",
      icon: <IconLeaf size={15} />,
      label: t("onboarding.steps.plants.label"),
      description: t("onboarding.steps.plants.description"),
      href: "/plants-center?tab=plants",
      done: hasPlants,
    },
    {
      key: "devices",
      icon: <IconCpu size={15} />,
      label: t("onboarding.steps.devices.label"),
      description: t("onboarding.steps.devices.description"),
      href: "/plants-center?tab=devices&register=1",
      done: hasDevices,
    },
    {
      key: "location",
      icon: <IconMapPin size={15} />,
      label: t("onboarding.steps.location.label"),
      description: t("onboarding.steps.location.description"),
      href: "/?setLocation=1",
      done: hasLocation,
    },
    {
      key: "notifications",
      icon: <IconBell size={15} />,
      label: t("onboarding.steps.notifications.label"),
      description: t("onboarding.steps.notifications.description"),
      href: "/settings",
      done: hasNotifications,
    },
  ];

  const allDone = hasPlants && hasDevices && hasLocation && hasNotifications;

  if (dismissed || !user || !plantsLoaded || !devicesLoaded || allDone) return null;

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <Paper shadow="xs" radius="md" p="lg" style={{ border: "1px solid var(--terracotta-100)" }}>
      <Group justify="space-between" mb="md" align="flex-start">
        <Stack gap={2}>
          <Text fw={600} c="var(--green-700)">
            {t("onboarding.title")}
          </Text>
          <Text size="sm" c="dimmed">
            {t("onboarding.progress", { completed: completedCount, total: steps.length })}
          </Text>
        </Stack>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label={t("onboarding.dismissAria")}
          onClick={() => {
            localStorage.setItem(DISMISSED_KEY, "true");
            setDismissed(true);
          }}
        >
          <IconX size={16} />
        </ActionIcon>
      </Group>

      <Stack gap="xs">
        {steps.map((step) => (
          <Group
            key={step.key}
            gap="sm"
            p="sm"
            style={{
              borderRadius: "var(--mantine-radius-sm)",
              background: step.done
                ? "var(--mantine-color-green-0)"
                : "var(--mantine-color-gray-0)",
              cursor: step.done ? "default" : "pointer",
              opacity: step.done ? 0.65 : 1,
              transition: "opacity 0.15s",
            }}
            onClick={() => {
              if (!step.done) navigate(step.href);
            }}
          >
            <ThemeIcon
              radius="xl"
              size="md"
              color={step.done ? "green" : "var(--green-700)"}
              variant={step.done ? "filled" : "light"}
            >
              {step.done ? <IconCheck size={13} /> : step.icon}
            </ThemeIcon>

            <Stack gap={0} style={{ flex: 1 }}>
              <Text
                size="sm"
                fw={500}
                td={step.done ? "line-through" : undefined}
                c={step.done ? "dimmed" : undefined}
              >
                {step.label}
              </Text>
              {!step.done && (
                <Text size="xs" c="dimmed">
                  {step.description}
                </Text>
              )}
            </Stack>

            {!step.done && (
              <Button
                variant="subtle"
                size="compact-sm"
                rightSection={<IconChevronRight size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(step.href);
                }}
              >
                {t("common.go")}
              </Button>
            )}
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}
