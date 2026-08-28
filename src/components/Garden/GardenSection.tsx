import { Paper, Skeleton, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGardenState } from "./useGardenState";
import GardenScene from "./GardenScene";

const cardStyle = { border: "1px solid var(--terracotta-100)" };

export default function GardenSection() {
  const { t } = useTranslation();
  const { loading, allDefinitions, earned, tier, newlyUnlockedKeys } = useGardenState({ toastOnEvaluate: true });

  useEffect(() => {
    if (window.location.hash !== "#garden") return;
    const el = document.getElementById("garden");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  return (
    <Paper id="garden" shadow="xs" radius="md" p="lg" style={cardStyle}>
      <Stack gap="md">
        <Stack gap={2}>
          <Text fw={600} c="var(--green-700)">
            {t("garden.title")}
          </Text>
          {loading ? (
            <Skeleton height={16} width="60%" />
          ) : (
            <Text size="sm" c="dimmed">
              {t(tier.nameKey)} — {t(tier.taglineKey)}
            </Text>
          )}
        </Stack>

        {loading ? (
          <Skeleton data-testid="garden-loading-skeleton" height={360} radius="md" />
        ) : (
          <GardenScene
            visualStage={tier.visualStage}
            allDefinitions={allDefinitions}
            earned={earned}
            newlyUnlockedKeys={newlyUnlockedKeys}
          />
        )}

        <Text size="xs" c="dimmed">
          {t("garden.footer")}
        </Text>
      </Stack>
    </Paper>
  );
}
