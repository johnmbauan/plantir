import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { UserExpedition } from "@/services/expeditionService";

interface Props {
  expedition: UserExpedition;
  onWelcome: () => Promise<void>;
  busy?: boolean;
}

export default function ReturnSequence({ expedition, onWelcome, busy }: Props) {
  const { t } = useTranslation();
  const outcome = expedition.outcome;

  return (
    <Paper shadow="xs" radius="md" p="lg" style={{ border: "1px solid var(--terracotta-100)" }}>
      <Stack gap="md">
        <Text fw={600} c="var(--green-700)">{t("garden.expeditionReady")}</Text>
        {expedition.team.map((key) => (
          <Text size="sm" key={key}>{t(`garden.creatures.${key}.return`)}</Text>
        ))}
        {outcome && (
          <>
            <Text size="sm">{t(`garden.stories.${outcome.storyKey}`)}</Text>
            {outcome.extraStoryKey && (
              <Text size="sm">{t(`garden.stories.${outcome.extraStoryKey}`)}</Text>
            )}
            {outcome.discoveryIds.map((id) => (
              <Text size="sm" key={id}>{t(`garden.discoveries.${id}`)}</Text>
            ))}
          </>
        )}
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
