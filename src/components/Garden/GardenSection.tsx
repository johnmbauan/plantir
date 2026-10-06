import { Paper, Skeleton, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import GardenScene from "./GardenScene";
import type { AchievementKey, GardenTier } from "@/constants/achievements";
import type { AchievementDefinition, EarnedAchievement } from "@/services/achievementService";

const cardStyle = { border: "1px solid var(--terracotta-100)" };

interface Props {
  loading: boolean;
  allDefinitions: AchievementDefinition[];
  earned: EarnedAchievement[];
  tier: GardenTier;
  newlyUnlockedKeys?: string[];
  travelingKeys?: AchievementKey[];
  onSelectCreature?: (key: AchievementKey) => void;
}

export default function GardenSection({
  loading,
  allDefinitions,
  earned,
  tier,
  newlyUnlockedKeys = [],
  travelingKeys = [],
  onSelectCreature,
}: Props) {
  const { t } = useTranslation();

  return (
    <Paper id="garden" shadow="xs" radius="md" p="lg" style={cardStyle}>
      <Stack gap="md">
        <Stack gap={2}>
          {loading ? (
            <Skeleton height={16} width="60%" />
          ) : (
            <Text size="sm" c="dimmed">
              {t("garden.tierCaption", { name: t(tier.nameKey), tagline: t(tier.taglineKey) })}
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
            travelingKeys={travelingKeys}
            onSelectCreature={onSelectCreature}
          />
        )}

        <Text size="xs" c="dimmed">
          {t("garden.footer")}
        </Text>
      </Stack>
    </Paper>
  );
}
