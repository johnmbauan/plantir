import { useMemo, useState } from "react";
import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { AchievementKey } from "@/constants/achievements";
import {
  availableDestinations,
  type DurationKey,
  type ExpeditionDestination,
} from "@/constants/expeditions";
import type { EarnedAchievement } from "@/services/achievementService";
import type { UserExpedition } from "@/services/expeditionService";
import ExpeditionCreaturePicker from "./ExpeditionCreaturePicker";
import { GardenSprite } from "./GardenSprites";
import MissionHelpButton from "./MissionHelpButton";
import "./ExpeditionMap.css";

interface Props {
  earned: EarnedAchievement[];
  expeditions: UserExpedition[];
  openExpedition?: UserExpedition | null;
  busy?: boolean;
  onDepart: (destinationId: string, duration: DurationKey, team: AchievementKey[]) => Promise<void>;
  onClose: () => void;
  onOpenHelp?: () => void;
}

export default function ExpeditionMap({
  earned,
  expeditions,
  openExpedition = null,
  busy,
  onDepart,
  onClose,
  onOpenHelp,
}: Props) {
  const { t } = useTranslation();
  const destinations = availableDestinations(earned.length);
  const [destinationId, setDestinationId] = useState(destinations[0]?.id ?? "");
  const destination = destinations.find((item) => item.id === destinationId) ?? destinations[0];
  const [duration, setDuration] = useState<DurationKey>(destination?.durations[0] ?? "laterToday");
  const [team, setTeam] = useState<AchievementKey[]>([]);

  const visitedByCreature = useMemo(() => {
    const map = new Map<AchievementKey, Set<string>>();
    for (const row of expeditions) {
      if (row.status === "cancelled") continue;
      for (const member of row.team) {
        const set = map.get(member) ?? new Set<string>();
        set.add(row.destination_id);
        map.set(member, set);
      }
    }
    return map;
  }, [expeditions]);

  function toggle(key: AchievementKey) {
    setTeam((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      if (current.length >= 3) return current;
      return [...current, key];
    });
  }

  function selectDestination(next: ExpeditionDestination) {
    setDestinationId(next.id);
    setDuration(next.durations[0]);
  }

  const canDepart = Boolean(destination && team.length >= 1 && duration);
  const party = team
    .map((key) => earned.find((item) => item.key === key))
    .filter((item): item is EarnedAchievement => Boolean(item));
  const outgoing = openExpedition && openExpedition.status !== "cancelled" && openExpedition.status !== "welcomed"
    ? openExpedition
    : null;

  if (outgoing) {
    return (
      <Paper className="expedition-map" shadow="xs" radius="md" p="lg">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={6} maw={560}>
              <Text fw={600} c="var(--green-700)">{t("garden.openMap")}</Text>
              <Text size="sm">{t("garden.mapBusy")}</Text>
              <Text size="sm" c="dimmed">{t("garden.mapBusyHint")}</Text>
            </Stack>
            <Group gap={4}>
              {onOpenHelp && <MissionHelpButton onClick={onOpenHelp} />}
              <Button className="expedition-map__close" variant="subtle" size="xs" onClick={onClose}>
                {t("common.close")}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper className="expedition-map" shadow="xs" radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={6} maw={560}>
            <Text fw={600} c="var(--green-700)">{t("garden.openMap")}</Text>
            <Text size="sm" c="dimmed" className="expedition-map__lead">
              {t("garden.noFailureNote")}
            </Text>
          </Stack>
          <Group gap={4}>
            {onOpenHelp && <MissionHelpButton onClick={onOpenHelp} />}
            <Button className="expedition-map__close" variant="subtle" size="xs" onClick={onClose}>
              {t("common.close")}
            </Button>
          </Group>
        </Group>

        <div className="expedition-map__steps">
          <section className="expedition-map__step">
            <h3 className="expedition-map__step-title">
              <span className="expedition-map__step-index">1</span>
              {t("garden.stepTrail")}
            </h3>
            <div className="expedition-map__trails">
              {destinations.map((item) => {
                const selected = item.id === destination?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`expedition-map__trail${selected ? " expedition-map__trail--selected" : ""}`}
                    aria-pressed={selected}
                    aria-label={t(`garden.destinations.${item.id}.name`)}
                    onClick={() => selectDestination(item)}
                  >
                    <span className="expedition-map__trail-name">
                      {t(`garden.destinations.${item.id}.name`)}
                    </span>
                    <span className="expedition-map__trail-family">
                      {t(`garden.families.${item.family}`)}
                    </span>
                    <span className="expedition-map__trail-premise">
                      {t(`garden.destinations.${item.id}.premise`)}
                    </span>
                  </button>
                );
              })}
            </div>
            {earned.length < 3 && (
              <Text size="sm" c="dimmed">{t("garden.mapLocked")}</Text>
            )}
          </section>

          {destination && (
            <section className="expedition-map__step">
              <h3 className="expedition-map__step-title">
                <span className="expedition-map__step-index">2</span>
                {t("garden.durationLabel")}
              </h3>
              <div className="expedition-map__durations">
                {destination.durations.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`expedition-map__duration${duration === key ? " expedition-map__duration--selected" : ""}`}
                    aria-pressed={duration === key}
                    onClick={() => setDuration(key)}
                  >
                    {t(`garden.durations.${key}`)}
                  </button>
                ))}
              </div>
              <Text size="xs" c="dimmed">
                {t("garden.recommendedTalents")}:{" "}
                {destination.recommendedTalents.map((talent) => t(`garden.talents.${talent}`)).join(", ")}
              </Text>
            </section>
          )}

          {destination && (
            <section className="expedition-map__step">
              <div className="expedition-map__step-head">
                <h3 className="expedition-map__step-title">
                  <span className="expedition-map__step-index">3</span>
                  {t("garden.selectTeam")}
                </h3>
                <Text size="sm" c="dimmed">{t("garden.teamPicked", { count: team.length })}</Text>
              </div>
              <ExpeditionCreaturePicker
                earned={earned}
                destination={destination}
                team={team}
                visitedByCreature={visitedByCreature}
                onToggle={toggle}
              />
            </section>
          )}
        </div>

        <div className="expedition-map__footer">
          <div className="expedition-map__party" aria-label={t("garden.selectTeam")}>
            {[0, 1, 2].map((index) => {
              const member = party[index];
              return (
                <span
                  key={member?.key ?? `empty-${index}`}
                  className={`expedition-map__party-slot${member ? " expedition-map__party-slot--filled" : ""}`}
                >
                  {member && <GardenSprite element={member.garden_element} size={28} />}
                </span>
              );
            })}
            <Text size="sm" c="dimmed">
              {team.length === 0 ? t("garden.pickCompanion") : team.length >= 3 ? t("garden.teamFull") : t("garden.teamPicked", { count: team.length })}
            </Text>
          </div>
          <Button
            className="expedition-map__submit"
            variant="filled"
            onClick={() => destination && void onDepart(destination.id, duration, team)}
            disabled={!canDepart || busy}
            loading={busy}
          >
            {t("garden.depart")}
          </Button>
        </div>
      </Stack>
    </Paper>
  );
}
