import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GARDEN_LAYOUT, type AchievementKey, type GardenVisualStage } from "@/constants/achievements";
import type { AchievementDefinition, EarnedAchievement } from "@/services/achievementService";
import soilDawn from "@/assets/garden/soil-dawn.png";
import soilDay from "@/assets/garden/soil-day.png";
import soilDusk from "@/assets/garden/soil-dusk.png";
import soilNight from "@/assets/garden/soil-night.png";
import gardenDawn from "@/assets/garden/garden-dawn.png";
import gardenDay from "@/assets/garden/garden-day.png";
import gardenDusk from "@/assets/garden/garden-dusk.png";
import gardenNight from "@/assets/garden/garden-night.png";
import forestDawn from "@/assets/garden/forest-dawn.png";
import forestDay from "@/assets/garden/forest-day.png";
import forestDusk from "@/assets/garden/forest-dusk.png";
import forestNight from "@/assets/garden/forest-night.png";
import GardenElement from "./GardenElement";
import "./GardenScene.css";

interface Props {
  visualStage: GardenVisualStage;
  allDefinitions: AchievementDefinition[];
  earned: EarnedAchievement[];
  newlyUnlockedKeys: string[];
  travelingKeys?: AchievementKey[];
  onSelectCreature?: (key: AchievementKey) => void;
  timeOfDay?: TimeOfDay;
}

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

const BACKDROPS: Record<GardenVisualStage, Record<TimeOfDay, string>> = {
  soil: { dawn: soilDawn, day: soilDay, dusk: soilDusk, night: soilNight },
  garden: { dawn: gardenDawn, day: gardenDay, dusk: gardenDusk, night: gardenNight },
  forest: { dawn: forestDawn, day: forestDay, dusk: forestDusk, night: forestNight },
};

function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 18) return "day";
  if (hour >= 18 && hour < 21) return "dusk";
  return "night";
}

function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getTimeOfDay());

  useEffect(() => {
    const updateTimeOfDay = () => setTimeOfDay(getTimeOfDay());
    const interval = window.setInterval(updateTimeOfDay, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return timeOfDay;
}

function GardenBackdrop({ visualStage, timeOfDay }: { visualStage: GardenVisualStage; timeOfDay: TimeOfDay }) {
  return (
    <img
      className="garden-backdrop-image"
      src={BACKDROPS[visualStage][timeOfDay]}
      alt=""
    />
  );
}

export default function GardenScene({
  visualStage,
  allDefinitions,
  earned,
  newlyUnlockedKeys,
  travelingKeys = [],
  onSelectCreature,
  timeOfDay: timeOfDayOverride,
}: Props) {
  const { t } = useTranslation();
  const detectedTimeOfDay = useTimeOfDay();
  const timeOfDay = timeOfDayOverride ?? detectedTimeOfDay;
  const earnedKeys = new Set(earned.map((e) => e.key));

  // Stable paint order: back-to-front by layout y so overlaps feel grounded
  const ordered = [...allDefinitions].sort((a, b) => {
    const ay = GARDEN_LAYOUT[a.garden_element].y;
    const by = GARDEN_LAYOUT[b.garden_element].y;
    return ay - by || a.sort_order - b.sort_order;
  });

  return (
    <div
      className={`garden-scene garden-scene--${visualStage} garden-scene--${timeOfDay}`}
      role="img"
      aria-label={t("garden.sceneAria")}
    >
      <div className="garden-backdrop" aria-hidden>
        <GardenBackdrop visualStage={visualStage} timeOfDay={timeOfDay} />
      </div>

      {ordered.map((definition) => (
        <GardenElement
          key={definition.key}
          definition={definition}
          earned={earnedKeys.has(definition.key)}
          animateIn={newlyUnlockedKeys.includes(definition.key)}
          traveling={travelingKeys.includes(definition.key)}
          onSelect={onSelectCreature}
        />
      ))}
    </div>
  );
}
