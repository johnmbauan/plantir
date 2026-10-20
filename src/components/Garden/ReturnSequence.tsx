import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { UserExpedition } from "@/services/expeditionService";
import { expeditionStory, storyParagraphs } from "./expeditionStory";
import "./ExpeditionJournal.css";

interface Props {
  expedition: UserExpedition;
  onWelcome: () => Promise<void>;
  busy?: boolean;
}

export default function ReturnSequence({ expedition, onWelcome, busy }: Props) {
  const { t } = useTranslation();
  const outcome = expedition.outcome;
  const story = expeditionStory(expedition, t);

  return (
    <Paper shadow="xs" radius="md" p="lg" style={{ border: "1px solid var(--terracotta-100)" }}>
      <Stack gap="md">
        <Text fw={600} c="var(--green-700)">{t("garden.expeditionReady")}</Text>
        {expedition.team.map((key) => (
          <Text size="sm" key={key}>{t(`garden.creatures.${key}.return`)}</Text>
        ))}
        {story && (
          <Stack gap="sm">
            {storyParagraphs(story.story).map((paragraph, index) => (
              <Text size="sm" key={`story-${index}`}>{paragraph}</Text>
            ))}
            {story.extra && storyParagraphs(story.extra).map((paragraph, index) => (
              <Text size="sm" key={`extra-${index}`}>{paragraph}</Text>
            ))}
            {story.hook && (
              <Text size="sm" className="expedition-journal__story-hook">{story.hook}</Text>
            )}
          </Stack>
        )}
        {outcome?.discoveryIds.map((id) => (
          <Text size="sm" key={id}>{t(`garden.discoveries.${id}`)}</Text>
        ))}
        <Group>
          <Button onClick={() => void onWelcome()} loading={busy}>
            {t("garden.welcomeReturn")}
          </Button>
          <Button variant="subtle" onClick={() => void onWelcome()} disabled={busy}>
            {t("garden.skipReturn")}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
