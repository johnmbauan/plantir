import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Stack, Group, Text, ThemeIcon, ActionIcon, Button } from "@mantine/core";
import {
  IconCheck,
  IconLeaf,
  IconCpu,
  IconBrandTelegram,
  IconX,
  IconChevronRight,
} from "@tabler/icons-react";
import supabase from "@/supabase";
import { fetchSettings } from "@/services/notificationService";

const DISMISSED_KEY = "onboarding_dismissed";

interface ChecklistStep {
  key: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

export default function OnboardingChecklist() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "true");
  const [hasPlants, setHasPlants] = useState(false);
  const [hasDevices, setHasDevices] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    async function checkProgress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [plantsRes, devicesRes, settings] = await Promise.all([
        supabase.from("plants").select("id").eq("user_id", user.id).limit(1),
        supabase.from("devices").select("id").eq("user_id", user.id).limit(1),
        fetchSettings().catch(() => null),
      ]);
      setHasPlants((plantsRes.data?.length ?? 0) > 0);
      setHasDevices((devicesRes.data?.length ?? 0) > 0);
      setHasTelegram(!!settings?.telegram_chat_id?.trim());
      setLoaded(true);
    }

    void checkProgress();
  }, [dismissed]);

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
      label: "Add your first device",
      description: "Register an Arduino humidity sensor and assign it to a plant.",
      href: "/plants-center?tab=devices",
      done: hasDevices,
    },
    {
      key: "telegram",
      icon: <IconBrandTelegram size={15} />,
      label: "Set up Telegram notifications",
      description: "Get watering and offline alerts sent directly to your phone.",
      href: "/settings",
      done: hasTelegram,
    },
  ];

  const allDone = hasPlants && hasDevices && hasTelegram;

  if (dismissed || !loaded || allDone) return null;

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
