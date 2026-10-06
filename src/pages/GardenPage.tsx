import { useMemo, useState } from "react";
import { Box, Button, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import CreatureProfile from "@/components/Garden/CreatureProfile";
import ExpeditionJournal from "@/components/Garden/ExpeditionJournal";
import ExpeditionMap from "@/components/Garden/ExpeditionMap";
import MissionHelpModal from "@/components/Garden/MissionHelpModal";
import GardenMissionBar from "@/components/Garden/GardenMissionBar";
import GardenSection from "@/components/Garden/GardenSection";
import ReturnSequence from "@/components/Garden/ReturnSequence";
import "@/components/Garden/GardenMissionBar.css";
import { expeditionsForCreature, useSanctuaryState } from "@/components/Garden/useSanctuaryState";
import { useGardenState } from "@/components/Garden/useGardenState";
import type { AchievementKey } from "@/constants/achievements";
import { FIRST_OUTING_ID, type DurationKey } from "@/constants/expeditions";
import {
  cancelExpedition,
  departExpedition,
  markIntroCompleted,
  welcomeExpedition,
} from "@/services/expeditionService";
import { getErrorMessage } from "@/utils/error";

export default function GardenPage() {
  const { t } = useTranslation();
  const garden = useGardenState();
  const sanctuary = useSanctuaryState();
  const [panel, setPanel] = useState<"none" | "map" | "journal">("none");
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<AchievementKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const firstCreature = garden.earned[0]?.key ?? null;
  const showIntro = Boolean(
    firstCreature &&
      garden.earned.length > 0 &&
      sanctuary.state?.sanctuary &&
      !sanctuary.state.sanctuary.intro_completed,
  );

  const readyExpedition = sanctuary.openExpedition?.status === "ready" ? sanctuary.openExpedition : null;
  const activeExpedition = sanctuary.openExpedition?.status === "active" ? sanctuary.openExpedition : null;

  const selectedDefinition = useMemo(
    () => garden.allDefinitions.find((item) => item.key === selectedKey) ?? null,
    [garden.allDefinitions, selectedKey],
  );
  const selectedEarned = useMemo(
    () => garden.earned.find((item) => item.key === selectedKey) ?? null,
    [garden.earned, selectedKey],
  );

  async function handleDepart(destinationId: string, duration: DurationKey, team: AchievementKey[]) {
    setBusy(true);
    try {
      await departExpedition(destinationId, duration, team);
      await sanctuary.refresh();
      setPanel("none");
    } catch (err) {
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleWelcome() {
    if (!readyExpedition) return;
    setBusy(true);
    try {
      await welcomeExpedition(readyExpedition.id);
      await sanctuary.refresh();
    } catch (err) {
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!activeExpedition) return;
    setBusy(true);
    try {
      await cancelExpedition(activeExpedition.id);
      await sanctuary.refresh();
      setCancelOpen(false);
    } catch (err) {
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function handleIntro(startOuting: boolean) {
    if (!firstCreature) return;
    await markIntroCompleted();
    if (startOuting) {
      await departExpedition(FIRST_OUTING_ID, "instant", [firstCreature]);
    }
    await sanctuary.refresh();
  }

  function handleSelect(key: AchievementKey) {
    const earned = garden.earned.some((item) => item.key === key);
    const traveling = sanctuary.travelingKeys.includes(key);
    if (traveling) {
      setPanel("none");
      return;
    }
    if (!earned) return;
    setSelectedKey(key);
    setPanel("none");
  }

  return (
    <Box p="md" maw={960} mx="auto" w="100%">
      <div className="garden-page__chrome">
        <div className="garden-page__header">
          <Title order={2} c="var(--green-700)">
            {t("garden.title")}
          </Title>
          <div className="garden-page__tools">
            <Button variant="light" onClick={() => setPanel((current) => (current === "journal" ? "none" : "journal"))}>
              {t("garden.openJournal")}
            </Button>
            {!activeExpedition && !readyExpedition && (
              <Button
                className="garden-page__send"
                variant="filled"
                onClick={() => setPanel((current) => (current === "map" ? "none" : "map"))}
                disabled={garden.earned.length === 0}
              >
                {t("garden.openMap")}
              </Button>
            )}
          </div>
        </div>

        {activeExpedition && (
          <GardenMissionBar
            expedition={activeExpedition}
            earned={garden.earned}
            cancelOpen={cancelOpen}
            busy={busy}
            onAskCancel={() => setCancelOpen(true)}
            onConfirmCancel={() => void handleCancel()}
            onKeepGoing={() => setCancelOpen(false)}
            onOpenHelp={() => setHelpOpen(true)}
          />
        )}
      </div>

      <MissionHelpModal
        opened={showIntro || helpOpen}
        mode={showIntro ? "intro" : "help"}
        onClose={() => {
          if (showIntro) void handleIntro(false);
          else setHelpOpen(false);
        }}
        onStartFirst={showIntro ? () => handleIntro(true) : undefined}
      />

      {readyExpedition && (
        <Box mb="md">
          <ReturnSequence expedition={readyExpedition} onWelcome={handleWelcome} busy={busy} />
        </Box>
      )}

      {panel === "journal" && sanctuary.state && (
        <Box mb="md">
          <ExpeditionJournal
            expeditions={sanctuary.state.expeditions}
            discoveries={sanctuary.state.discoveries}
            onClose={() => setPanel("none")}
          />
        </Box>
      )}

      {panel === "map" && (
        <Box mb="md">
          <ExpeditionMap
            earned={garden.earned}
            expeditions={sanctuary.state?.expeditions ?? []}
            openExpedition={sanctuary.openExpedition}
            busy={busy}
            onDepart={handleDepart}
            onClose={() => setPanel("none")}
            onOpenHelp={() => setHelpOpen(true)}
          />
        </Box>
      )}

      <GardenSection
        loading={garden.loading}
        allDefinitions={garden.allDefinitions}
        earned={garden.earned}
        tier={garden.tier}
        newlyUnlockedKeys={garden.newlyUnlockedKeys}
        travelingKeys={sanctuary.travelingKeys}
        onSelectCreature={handleSelect}
      />

      {selectedKey && selectedDefinition && selectedEarned && sanctuary.state && (
        <Box mt="md">
          <CreatureProfile
            creatureKey={selectedKey}
            definition={selectedDefinition}
            earned={selectedEarned}
            bond={sanctuary.state.bonds.find((row) => row.achievement_key === selectedKey) ?? null}
            events={sanctuary.state.events.filter((row) => row.achievement_key === selectedKey)}
            discoveries={sanctuary.state.discoveries}
            history={expeditionsForCreature(sanctuary.state.expeditions, selectedKey)}
            onClose={() => setSelectedKey(null)}
          />
        </Box>
      )}

    </Box>
  );
}
