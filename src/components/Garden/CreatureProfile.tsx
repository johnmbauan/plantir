import { ActionIcon, Group, HoverCard, Modal, Progress, Stack, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { AchievementKey } from "@/constants/achievements";
import { CREATURES } from "@/constants/creatures";
import { BOND_LEVEL_THRESHOLDS, pointsToNextLevel } from "@/constants/expeditions";
import type { AchievementDefinition, EarnedAchievement } from "@/services/achievementService";
import type { BondEvent, CreatureBond, UserDiscovery, UserExpedition } from "@/services/expeditionService";
import { achievementCopy } from "@/utils/achievementDisplay";
import { GardenSprite } from "./GardenSprites";

function SectionTitle({ title, description }: { title: string; description: string }) {
  const { t } = useTranslation();

  return (
    <Group gap={6} wrap="nowrap">
      <Text size="sm" fw={600} c="var(--green-700)">{title}</Text>
      <HoverCard width={280} shadow="md" withArrow openDelay={0} closeDelay={100} withinPortal position="top">
        <HoverCard.Target>
          <ActionIcon
            variant="light"
            color="gray"
            size="sm"
            radius="xl"
            aria-label={t("garden.profile.sectionHelp", { title })}
            style={{ color: "var(--green-700)", cursor: "help" }}
          >
            <IconInfoCircle size={16} />
          </ActionIcon>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Text size="sm">{description}</Text>
        </HoverCard.Dropdown>
      </HoverCard>
    </Group>
  );
}

function profileDate(iso: string, language: string): string {
  return new Date(iso).toLocaleDateString(language.startsWith("it") ? "it-IT" : "en-US");
}

function destinationLabel(
  id: string,
  translate: (key: string) => string,
  exists: (key: string) => boolean,
): string | null {
  const key = `garden.destinations.${id}.name`;
  if (!exists(key)) return null;
  const name = translate(key);
  return name || null;
}

interface OutingRow {
  key: string;
  title: string;
  date: string;
  treasures: UserDiscovery[];
  bondGrew: boolean;
}

function outingRows(
  history: UserExpedition[],
  events: BondEvent[],
  discoveries: UserDiscovery[],
  untitled: string,
  translate: (key: string) => string,
  exists: (key: string) => boolean,
  language: string,
): OutingRow[] {
  const matchedEventIds = new Set<string>();
  const rows: OutingRow[] = history.slice(0, 6).map((row) => {
    const matched = events.filter((event) =>
      event.source === "expedition" &&
      (event.subject_id === row.id || event.subject_id === row.destination_id),
    );
    for (const event of matched) matchedEventIds.add(event.id);
    return {
      key: row.id,
      title: destinationLabel(row.destination_id, translate, exists) ?? untitled,
      date: profileDate(row.returns_at || row.started_at, language),
      treasures: discoveries.filter((item) => item.expedition_id === row.id),
      bondGrew: matched.length > 0,
    };
  });

  for (const event of events) {
    if (matchedEventIds.has(event.id)) continue;
    if (event.source === "expedition") {
      rows.push({
        key: event.id,
        title: destinationLabel(event.subject_id, translate, exists) ?? untitled,
        date: profileDate(event.created_at, language),
        treasures: [],
        bondGrew: true,
      });
    }
  }

  return rows;
}

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
  const needed = path.next ?? BOND_LEVEL_THRESHOLDS[4];
  const date = profileDate(earned.unlocked_at, i18n.language);
  const companionLabel = t("garden.bondLevels.4");
  const outings = outingRows(
    history,
    events,
    discoveries,
    t("garden.profile.outingUntitled"),
    t,
    (key) => i18n.exists(key),
    i18n.language,
  );
  const careEvents = events.filter((event) => event.source !== "expedition").slice(0, 4);
  const emptyLog = outings.length === 0 && careEvents.length === 0;

  return (
    <Modal
      opened
      onClose={onClose}
      title={
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <GardenSprite element={definition.garden_element} size={40} animated />
          <Stack gap={2}>
            <Text fw={700} c="var(--green-700)">{name}</Text>
            <Text size="sm" c="dimmed">{t(`garden.creatures.${creatureKey}.intro`)}</Text>
            <Text size="sm">{t(`garden.creatures.${creatureKey}.personality`)}</Text>
          </Stack>
        </Group>
      }
      size="lg"
      centered
      closeButtonProps={{ "aria-label": t("common.close") }}
      transitionProps={{ duration: 0 }}
    >
      <Stack gap="md">
        <Stack gap={6}>
          <SectionTitle title={t("garden.profile.bond")} description={t("garden.profile.bondHelp")} />
          <Group justify="space-between" align="baseline" gap="sm">
            <Text size="sm">{t(`garden.bondLevels.${level}`)}</Text>
            <Text size="xs" c="dimmed">{t("garden.profile.bondPoints", { points, needed })}</Text>
          </Group>
          <Progress
            value={path.progress * 100}
            color="var(--green-500)"
            aria-label={`${t("garden.profile.bond")} ${level}`}
          />
          <Text size="xs" c="dimmed">
            {nextLabel ? t("garden.profile.bondNext", { label: nextLabel }) : t("garden.profile.maxBond")}
          </Text>
        </Stack>

        <Stack gap={4}>
          <SectionTitle title={t("garden.profile.talents")} description={t("garden.profile.talentsLead")} />
          <Text size="sm">{t("garden.talents." + creature.primaryTalent)}</Text>
          {creature.secondaryTalent && (
            <Text size="sm" c="dimmed">{t("garden.talents." + creature.secondaryTalent)}</Text>
          )}
        </Stack>

        <Stack gap={4}>
          <SectionTitle title={t("garden.profile.memories")} description={t("garden.profile.memoriesLead")} />
          {memoriesUnlocked === 0 && (
            <Text size="sm" c="dimmed">
              {t("garden.profile.memoriesLocked", { label: t("garden.bondLevels.2") })}
            </Text>
          )}
          {Array.from({ length: memoriesUnlocked }, (_, index) => (
            <Text size="sm" key={index}>{t(`garden.creatures.${creatureKey}.memories.${index + 1}`)}</Text>
          ))}
        </Stack>

        <Stack gap={4}>
          <SectionTitle
            title={t("garden.profile.personalExpedition")}
            description={t("garden.profile.personalHelp", { label: companionLabel })}
          />
          <Text size="sm" c="dimmed">
            {level >= 4 ? t("garden.profile.personalOpen") : t("garden.profile.personalLocked")}
          </Text>
        </Stack>

        <Stack gap={4}>
          <SectionTitle title={t("garden.profile.outings")} description={t("garden.profile.outingsLead")} />
          {emptyLog && (
            <Text size="sm" c="dimmed">{t("garden.profile.outingEmpty")}</Text>
          )}
          {outings.map((row) => (
            <Stack gap={2} key={row.key}>
              <Text size="sm">{row.title}</Text>
              <Text size="xs" c="dimmed">{row.date}</Text>
              {row.treasures.map((item) => (
                <Text size="sm" key={item.discovery_id}>{t(`garden.discoveries.${item.discovery_id}`)}</Text>
              ))}
              {row.bondGrew && (
                <Text size="xs" c="dimmed">{t("garden.profile.outingBond")}</Text>
              )}
            </Stack>
          ))}
          {careEvents.map((event) => (
            <Stack gap={2} key={event.id}>
              <Text size="sm">
                {t(`garden.bondReasons.${event.reason_code}`, { defaultValue: event.reason_code })}
              </Text>
              <Text size="xs" c="dimmed">{profileDate(event.created_at, i18n.language)}</Text>
            </Stack>
          ))}
        </Stack>

        <Stack gap={4}>
          <SectionTitle title={t("garden.profile.origin")} description={t("garden.profile.originLead")} />
          <Text size="xs" c="dimmed">{t("garden.profile.originLine", { name: origin.name, date })}</Text>
        </Stack>
      </Stack>
    </Modal>
  );
}
