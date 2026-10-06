import { Button, Group, Paper, Progress, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { AchievementKey } from "@/constants/achievements";
import { CREATURES } from "@/constants/creatures";
import { BOND_LEVEL_THRESHOLDS, pointsToNextLevel } from "@/constants/expeditions";
import type { AchievementDefinition, EarnedAchievement } from "@/services/achievementService";
import type { BondEvent, CreatureBond, UserDiscovery, UserExpedition } from "@/services/expeditionService";
import { achievementCopy } from "@/utils/achievementDisplay";
import { GardenSprite } from "./GardenSprites";

interface Props {
  creatureKey: AchievementKey;
  definition: AchievementDefinition;
  earned: EarnedAchievement;
  bond: CreatureBond | null;
  events: BondEvent[];
  discoveries: UserDiscovery[];
  history: UserExpedition[];
  onClose: () => void;
}

export default function CreatureProfile({
  creatureKey,
  definition,
  earned,
  bond,
  events,
  discoveries,
  history,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation();
  const creature = CREATURES[creatureKey];
  const origin = achievementCopy(creatureKey, definition);
  const name = t(`garden.creatures.${creatureKey}.name`);
  const points = bond?.bond_points ?? 0;
  const level = bond?.bond_level ?? 1;
  const path = pointsToNextLevel(points);
  const memoriesUnlocked = Math.min(4, Math.max(0, level - 1));
  const nextLabel = level < 5 ? t(`garden.bondLevels.${level + 1}`) : null;
  const date = new Date(earned.unlocked_at).toLocaleDateString(i18n.language.startsWith("it") ? "it-IT" : "en-US");

  const creatureDiscoveries = discoveries.filter((item) =>
    history.some((row) => row.team.includes(creatureKey) && row.id === item.expedition_id),
  );

  return (
    <Paper shadow="xs" radius="md" p="lg" style={{ border: "1px solid var(--terracotta-100)" }}>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Group gap="md">
            <GardenSprite element={definition.garden_element} size={56} animated />
            <Stack gap={2}>
              <Text fw={600} c="var(--green-700)">{name}</Text>
              <Text size="sm" c="dimmed">{t(`garden.creatures.${creatureKey}.intro`)}</Text>
            </Stack>
          </Group>
          <Button variant="subtle" size="xs" onClick={onClose}>{t("common.close")}</Button>
        </Group>

        <Text size="sm">{t(`garden.creatures.${creatureKey}.personality`)}</Text>

        <Stack gap={4}>
          <Text size="sm" fw={600} c="var(--green-700)">{t("garden.profile.origin")}</Text>
          <Text size="sm">{origin.name}</Text>
          <Text size="xs" c="dimmed">{origin.description}</Text>
          <Text size="xs" c="dimmed">{t("garden.profile.unlockedOn", { date })}</Text>
        </Stack>

        <Stack gap={6}>
          <Text size="sm" fw={600} c="var(--green-700)">
            {t("garden.profile.bond")}: {t(`garden.bondLevels.${level}`)}
          </Text>
          <Progress
            value={path.progress * 100}
            color="var(--green-500)"
            aria-label={`${t("garden.profile.bond")} ${level}`}
          />
          <Text size="xs" c="dimmed">
            {nextLabel
              ? t("garden.profile.nextUnlock", { label: nextLabel })
              : t("garden.profile.maxBond")}
            {path.next != null ? ` (${points}/${BOND_LEVEL_THRESHOLDS[level]})` : ""}
          </Text>
        </Stack>

        <Stack gap={4}>
          <Text size="sm" fw={600}>{t("garden.talents." + creature.primaryTalent)}</Text>
          {creature.secondaryTalent && (
            <Text size="sm" c="dimmed">{t("garden.talents." + creature.secondaryTalent)}</Text>
          )}
        </Stack>

        <Stack gap={4}>
          <Text size="sm" fw={600} c="var(--green-700)">{t("garden.profile.memories")}</Text>
          {memoriesUnlocked === 0 && (
            <Text size="sm" c="dimmed">{t("garden.profile.nextUnlock", { label: t("garden.bondLevels.2") })}</Text>
          )}
          {Array.from({ length: memoriesUnlocked }, (_, index) => (
            <Text size="sm" key={index}>{t(`garden.creatures.${creatureKey}.memories.${index + 1}`)}</Text>
          ))}
        </Stack>

        <Stack gap={4}>
          <Text size="sm" fw={600} c="var(--green-700)">{t("garden.profile.personalExpedition")}</Text>
          <Text size="sm" c="dimmed">
            {level >= 4 ? t(`garden.creatures.${creatureKey}.intro`) : t("garden.profile.personalLocked")}
          </Text>
        </Stack>

        <Stack gap={4}>
          <Text size="sm" fw={600} c="var(--green-700)">{t("garden.profile.keepsakes")}</Text>
          {creatureDiscoveries.length === 0 ? (
            <Text size="sm" c="dimmed">{t("garden.journal.empty")}</Text>
          ) : creatureDiscoveries.map((item) => (
            <Text size="sm" key={item.discovery_id}>{t(`garden.discoveries.${item.discovery_id}`)}</Text>
          ))}
        </Stack>

        <Stack gap={4}>
          <Text size="sm" fw={600} c="var(--green-700)">{t("garden.profile.recentProgress")}</Text>
          {events.slice(0, 4).map((event) => (
            <Text size="xs" c="dimmed" key={event.id}>
              {t(`garden.bondReasons.${event.reason_code}`, {
                defaultValue: event.reason_code,
                destination: t(`garden.destinations.${event.subject_id}.name`, { defaultValue: "" }),
              })}
            </Text>
          ))}
        </Stack>

        <Stack gap={4}>
          <Text size="sm" fw={600} c="var(--green-700)">{t("garden.profile.history")}</Text>
          {history.length === 0 ? (
            <Text size="sm" c="dimmed">{t("garden.profile.noHistory")}</Text>
          ) : history.slice(0, 6).map((row) => (
            <Text size="sm" key={row.id}>
              {t(`garden.destinations.${row.destination_id}.name`)}
            </Text>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
