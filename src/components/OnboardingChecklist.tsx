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
import { useAuth } from "@/context/AuthContext";
import {
  ONBOARDING_CHANGED_EVENT,
  isSkippableOnboardingStep,
  type OnboardingStep,
  type SkippableOnboardingStep,
} from "@/constants/onboarding";
import {
  dismissOnboarding,
  fetchOnboarding,
  isOnboardingStepComplete,
  isOnboardingStepSkipped,
  isOnboardingVisible,
  skipOnboardingStep,
  type OnboardingProgress,
} from "@/services/onboardingService";

interface ChecklistStep {
  key: OnboardingStep;
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}

export default function OnboardingChecklist() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setProgress(null);
      setLoaded(true);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const next = await fetchOnboarding();
        if (!cancelled) {
          setProgress(next);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setProgress(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    setLoaded(false);
    void load();

    const onChanged = () => {
      void load();
    };
    window.addEventListener(ONBOARDING_CHANGED_EVENT, onChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(ONBOARDING_CHANGED_EVENT, onChanged);
    };
  }, [user]);

  if (!user || !loaded || !progress || !isOnboardingVisible(progress)) {
    return null;
  }

  const steps: ChecklistStep[] = [
    {
      key: "plants",
      icon: <IconLeaf size={15} />,
      label: t("onboarding.steps.plants.label"),
      description: t("onboarding.steps.plants.description"),
      href: "/plants-center?tab=plants",
    },
    {
      key: "devices",
      icon: <IconCpu size={15} />,
      label: t("onboarding.steps.devices.label"),
      description: t("onboarding.steps.devices.description"),
      href: "/plants-center?tab=devices&register=1",
    },
    {
      key: "location",
      icon: <IconMapPin size={15} />,
      label: t("onboarding.steps.location.label"),
      description: t("onboarding.steps.location.description"),
      href: "/?setLocation=1",
    },
    {
      key: "notifications",
      icon: <IconBell size={15} />,
      label: t("onboarding.steps.notifications.label"),
      description: t("onboarding.steps.notifications.description"),
      href: "/settings",
    },
  ];

  const visibleSteps = steps.filter(
    (step) =>
      isOnboardingStepComplete(progress, step.key) || !isOnboardingStepSkipped(progress, step.key),
  );
  const completedCount = steps.filter((step) => isOnboardingStepComplete(progress, step.key)).length;

  function handleSkip(step: SkippableOnboardingStep) {
    const skippedAt = new Date().toISOString();
    setProgress((prev) => {
      if (!prev) return prev;
      return step === "location"
        ? { ...prev, skippedLocationAt: skippedAt }
        : { ...prev, skippedNotificationsAt: skippedAt };
    });
    void skipOnboardingStep(step).catch((err) => {
      console.error(err);
    });
  }

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
            setProgress({ ...progress, dismissedAt: new Date().toISOString() });
            void dismissOnboarding().catch((err) => {
              console.error(err);
            });
          }}
        >
          <IconX size={16} />
        </ActionIcon>
      </Group>

      <Stack gap="xs">
        {visibleSteps.map((step) => {
          const done = isOnboardingStepComplete(progress, step.key);
          const skippable = !done && isSkippableOnboardingStep(step.key);
          return (
            <Group
              key={step.key}
              gap="sm"
              p="sm"
              style={{
                borderRadius: "var(--mantine-radius-sm)",
                background: done
                  ? "var(--mantine-color-green-0)"
                  : "var(--mantine-color-gray-0)",
                cursor: done ? "default" : "pointer",
                opacity: done ? 0.65 : 1,
                transition: "opacity 0.15s",
              }}
              onClick={() => {
                if (!done) navigate(step.href);
              }}
            >
              <ThemeIcon
                radius="xl"
                size="md"
                color={done ? "green" : "var(--green-700)"}
                variant={done ? "filled" : "light"}
              >
                {done ? <IconCheck size={13} /> : step.icon}
              </ThemeIcon>

              <Stack gap={0} style={{ flex: 1 }}>
                <Text
                  size="sm"
                  fw={500}
                  td={done ? "line-through" : undefined}
                  c={done ? "dimmed" : undefined}
                >
                  {step.label}
                </Text>
                {!done && (
                  <Text size="xs" c="dimmed">
                    {step.description}
                  </Text>
                )}
              </Stack>

              {!done && (
                <Group gap={4} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
                  {skippable && (
                    <Button
                      variant="subtle"
                      color="gray"
                      size="compact-sm"
                      onClick={() => {
                        if (isSkippableOnboardingStep(step.key)) handleSkip(step.key);
                      }}
                    >
                      {t("onboarding.skip")}
                    </Button>
                  )}
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    rightSection={<IconChevronRight size={14} />}
                    onClick={() => navigate(step.href)}
                  >
                    {t("common.go")}
                  </Button>
                </Group>
              )}
            </Group>
          );
        })}
      </Stack>
    </Paper>
  );
}
