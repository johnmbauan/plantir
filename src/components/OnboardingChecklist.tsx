import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useWeatherCity } from "@/context/WeatherCityContext";

const DISMISSED_KEY = "onboarding_dismissed";
const SETTINGS_VISITED_KEY = "settings_visited";
const SETTINGS_IMPLICIT_DAYS = 3;

interface ChecklistStep {
  key: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

interface OnboardingChecklistProps {
  plantsLoaded: boolean;
  hasPlants: boolean;
  hasDevices: boolean;
  oldestPlantCreatedAt: string | null;
}

function notificationsStepDone(
  hasPlants: boolean,
  hasDevices: boolean,
  oldestPlantCreatedAt: string | null,
  nowMs: number,
): boolean {
  const explicitlyVisited = localStorage.getItem(SETTINGS_VISITED_KEY) === "true";
  const plantIsOldEnough = oldestPlantCreatedAt
    ? nowMs - new Date(oldestPlantCreatedAt).getTime() >= SETTINGS_IMPLICIT_DAYS * 24 * 60 * 60 * 1000
    : false;
  return explicitlyVisited || (hasPlants && hasDevices && plantIsOldEnough);
}

export default function OnboardingChecklist({
  plantsLoaded,
  hasPlants,
  hasDevices,
  oldestPlantCreatedAt,
}: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const { city } = useWeatherCity();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "true");
  // Capture mount time once so age checks stay pure across re-renders.
  const [nowMs] = useState(() => Date.now());
  const hasLocation = city !== null;
  const hasNotifications = plantsLoaded
    && notificationsStepDone(hasPlants, hasDevices, oldestPlantCreatedAt, nowMs);

  const steps: ChecklistStep[] = [
    {
      key: "plants",
      icon: <IconLeaf size={15} />,
      label: "Add your first plant",
      description: "Give it a name and optionally a photo.",
      href: "/plants-center?tab=plants",
      done: hasPlants,
    },
    {
      key: "devices",
      icon: <IconCpu size={15} />,
      label: "Register your first device",
      description: "Use the guided wizard to link a Plantir sensor to your account.",
      href: "/plants-center?tab=devices&register=1",
      done: hasDevices,
    },
    {
      key: "location",
      icon: <IconMapPin size={15} />,
      label: "Set your location",
      description: "Choose your city so outdoor plants can get rain-aware watering alerts.",
      href: "/?setLocation=1",
      done: hasLocation,
    },
    {
      key: "notifications",
      icon: <IconBell size={15} />,
      label: "Review notification settings",
      description: "Choose when to receive watering and offline alerts in the app.",
      href: "/settings",
      done: hasNotifications,
    },
  ];

  const allDone = hasPlants && hasDevices && hasLocation && hasNotifications;

  if (dismissed || !plantsLoaded || allDone) return null;

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <Paper shadow="xs" radius="md" p="lg" style={{ border: "1px solid var(--terracotta-100)" }}>
      <Group justify="space-between" mb="md" align="flex-start">
        <Stack gap={2}>
          <Text fw={600} c="var(--green-700)">
            Get started with Plantir
          </Text>
          <Text size="sm" c="dimmed">
            {completedCount} of {steps.length} steps complete — finish setup to start monitoring your plants.
          </Text>
        </Stack>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Dismiss onboarding"
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
                Go
              </Button>
            )}
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}
