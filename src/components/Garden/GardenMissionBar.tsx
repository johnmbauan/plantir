import { Button, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { EarnedAchievement } from "@/services/achievementService";
import type { UserExpedition } from "@/services/expeditionService";
import { formatReturnLabel } from "./formatReturnLabel";
import { GardenSprite } from "./GardenSprites";
import MissionHelpButton from "./MissionHelpButton";
import "./GardenMissionBar.css";

interface Props {
  expedition: UserExpedition;
  earned: EarnedAchievement[];
  cancelOpen: boolean;
  busy?: boolean;
  onAskCancel: () => void;
  onConfirmCancel: () => void;
  onKeepGoing: () => void;
  onOpenHelp: () => void;
}

export default function GardenMissionBar({
  expedition,
  earned,
  cancelOpen,
  busy,
  onAskCancel,
  onConfirmCancel,
  onKeepGoing,
  onOpenHelp,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("it") ? "it-IT" : "en-US";

  return (
    <aside className="garden-mission" aria-live="polite">
      <div className="garden-mission__top">
        <div className="garden-mission__copy">
          <Text className="garden-mission__kicker">{t("garden.expeditionStatus")}</Text>
          <h3 className="garden-mission__title">
            {t(`garden.destinations.${expedition.destination_id}.name`)}
          </h3>
          <Text size="sm" className="garden-mission__when">
            {formatReturnLabel(expedition.returns_at, locale, t)}
          </Text>
          <Text size="sm" className="garden-mission__premise">
            {t(`garden.destinations.${expedition.destination_id}.premise`)}
          </Text>
        </div>
        {cancelOpen ? (
          <div className="garden-mission__confirm">
            <Text size="sm">{t("garden.cancelConfirm")}</Text>
            <div className="garden-mission__actions">
              <Button color="red" onClick={onConfirmCancel} loading={busy}>
                {t("garden.confirmCancel")}
              </Button>
              <Button variant="subtle" onClick={onKeepGoing}>
                {t("garden.keepGoing")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="garden-mission__actions">
            <MissionHelpButton onClick={onOpenHelp} />
            <Button variant="default" onClick={onAskCancel}>
              {t("garden.cancelExpedition")}
            </Button>
          </div>
        )}
      </div>
      <div className="garden-mission__party" aria-label={t("garden.missionTeam")}>
        {expedition.team.map((key) => {
          const member = earned.find((item) => item.key === key);
          return (
            <span key={key} className="garden-mission__member">
              {member && <GardenSprite element={member.garden_element} size={28} />}
              <span>{t(`garden.creatures.${key}.name`)}</span>
            </span>
          );
        })}
      </div>
    </aside>
  );
}
