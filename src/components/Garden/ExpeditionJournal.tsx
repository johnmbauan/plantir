import { Button, Group, Paper, Progress, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { destinationById, EXPEDITION_DESTINATIONS } from "@/constants/expeditions";
import type { UserDiscovery, UserExpedition } from "@/services/expeditionService";
import "./ExpeditionJournal.css";

interface Props {
  expeditions: UserExpedition[];
  discoveries: UserDiscovery[];
  onClose: () => void;
}

export default function ExpeditionJournal({ expeditions, discoveries, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("it") ? "it-IT" : "en-US";
  const found = new Set(discoveries.map((item) => item.discovery_id));
  const welcomed = expeditions
    .filter((row) => row.status === "welcomed")
    .slice()
    .sort((left, right) => Date.parse(right.returns_at) - Date.parse(left.returns_at));
  const visitedIds = new Set(welcomed.map((row) => row.destination_id));
  const empty = welcomed.length === 0 && discoveries.length === 0;
  const trailsStarted = EXPEDITION_DESTINATIONS.filter((destination) => visitedIds.has(destination.id)).length;

  return (
    <Paper className="expedition-journal" shadow="xs" radius="md" p="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={6} maw={560}>
            <Text fw={600} c="var(--green-700)" component="h2" className="expedition-journal__section-title">
              {t("garden.journal.title")}
            </Text>
            <Text size="sm" className="expedition-journal__lead">
              {t("garden.journal.lead")}
            </Text>
          </Stack>
          <Button variant="subtle" size="xs" onClick={onClose}>{t("common.close")}</Button>
        </Group>

        <div className="expedition-journal__summary" aria-label={t("garden.journal.title")}>
          <SummaryStat value={welcomed.length} label={t("garden.journal.stories")} />
          <SummaryStat value={discoveries.length} label={t("garden.journal.keepsakes")} />
          <SummaryStat value={trailsStarted} label={t("garden.journal.destinations")} />
        </div>

        {empty && (
          <Stack gap={4}>
            <Text size="sm">{t("garden.journal.empty")}</Text>
            <Text size="sm" c="dimmed">{t("garden.journal.emptyHint")}</Text>
          </Stack>
        )}

        {!empty && (
          <Stack gap="sm">
            <Text fw={600} c="var(--green-700)" component="h3" className="expedition-journal__section-title">
              {t("garden.journal.stories")}
            </Text>
            {welcomed.length === 0 ? (
              <Text size="sm" c="dimmed">{t("garden.journal.empty")}</Text>
            ) : (
              <div className="expedition-journal__stories">
                {welcomed.map((row, index) => (
                  <StoryCard key={row.id} expedition={row} latest={index === 0} locale={locale} />
                ))}
              </div>
            )}
          </Stack>
        )}

        {!empty && (
          <Stack gap="sm">
            <Text fw={600} c="var(--green-700)" component="h3" className="expedition-journal__section-title">
              {t("garden.journal.keepsakes")}
            </Text>
            {discoveries.length === 0 ? (
              <Text size="sm" c="dimmed">{t("garden.journal.empty")}</Text>
            ) : (
              <div className="expedition-journal__keepsakes">
                {discoveries
                  .slice()
                  .sort((left, right) => Date.parse(right.unlocked_at) - Date.parse(left.unlocked_at))
                  .map((item) => {
                    const destination = destinationById(
                      welcomed.find((row) => row.id === item.expedition_id)?.destination_id ?? "",
                    );
                    return (
                      <div className="expedition-journal__keepsake" key={item.discovery_id}>
                        <Text size="sm" fw={600}>{t(`garden.discoveries.${item.discovery_id}`)}</Text>
                        {destination && (
                          <Text size="xs" c="dimmed">{t(`garden.destinations.${destination.id}.name`)}</Text>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </Stack>
        )}

        <Stack gap="sm">
          <Text fw={600} c="var(--green-700)" component="h3" className="expedition-journal__section-title">
            {t("garden.journal.destinations")}
          </Text>
          <div className="expedition-journal__trails">
            {EXPEDITION_DESTINATIONS.map((destination) => {
              const foundCount = destination.discoveryIds.filter((id) => found.has(id)).length;
              const total = destination.discoveryIds.length;
              const complete = total > 0 && foundCount === total;
              const started = visitedIds.has(destination.id);
              const state = complete ? "complete" : started ? "started" : "unvisited";
              return (
                <div
                  className={`expedition-journal__trail expedition-journal__trail--${state}`}
                  key={destination.id}
                >
                  <Stack gap={8}>
                    <Text size="sm" fw={600}>{t(`garden.destinations.${destination.id}.name`)}</Text>
                    <Progress
                      value={total === 0 ? 0 : (foundCount / total) * 100}
                      color={complete ? "var(--green-500)" : started ? "var(--terracotta-500)" : "var(--stone-100)"}
                      size="sm"
                      aria-label={t("garden.journal.foundOf", { found: foundCount, total })}
                    />
                    <Text size="xs" c="dimmed">
                      {t("garden.journal.foundOf", { found: foundCount, total })}
                    </Text>
                    <Text size="xs">
                      {t(`garden.destinations.${destination.id}.premise`)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {complete
                        ? t("garden.journal.complete")
                        : started
                          ? t("garden.journal.hint")
                          : t(`garden.families.${destination.family}`)}
                    </Text>
                    {!started && (
                      <Text size="xs" c="dimmed">{t("garden.journal.unvisited")}</Text>
                    )}
                  </Stack>
                </div>
              );
            })}
          </div>
        </Stack>
      </Stack>
    </Paper>
  );
}

function SummaryStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="expedition-journal__stat">
      <span className="expedition-journal__stat-value">{value}</span>
      <span className="expedition-journal__stat-label">{label}</span>
    </div>
  );
}

function StoryCard({
  expedition,
  latest,
  locale,
}: {
  expedition: UserExpedition;
  latest: boolean;
  locale: string;
}) {
  const { t } = useTranslation();
  const names = expedition.team.map((key) => t(`garden.creatures.${key}.name`)).join(", ");
  const date = new Date(expedition.returns_at).toLocaleDateString(locale);
  const storyKey = expedition.outcome?.storyKey ?? expedition.destination_id;
  const extraStoryKey = expedition.outcome?.extraStoryKey;

  return (
    <article className={`expedition-journal__story${latest ? " expedition-journal__story--latest" : ""}`}>
      <Stack gap={6}>
        {latest && (
          <Text className="expedition-journal__story-kicker">{t("garden.journal.latestStory")}</Text>
        )}
        <Text fw={600} c="var(--green-700)">{t(`garden.destinations.${expedition.destination_id}.name`)}</Text>
        <Text size="xs" c="dimmed">
          {t("garden.journal.withTeam", { names })} · {date}
        </Text>
        <Text size="sm">{t(`garden.stories.${storyKey}`)}</Text>
        {extraStoryKey && (
          <Text size="sm">{t(`garden.stories.${extraStoryKey}`)}</Text>
        )}
      </Stack>
    </article>
  );
}
