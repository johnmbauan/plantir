import { useMemo, useState } from "react";
import { Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import IconSearch from "@/components/icons/IconSearch";
import type { AchievementKey } from "@/constants/achievements";
import { creatureTalents, type CreatureTalent } from "@/constants/creatures";
import type { ExpeditionDestination } from "@/constants/expeditions";
import type { EarnedAchievement } from "@/services/achievementService";
import { matchesAnySearchField } from "@/utils/search";
import { GardenSprite } from "./GardenSprites";

type TeamFilter = "all" | "helpful" | "new";

interface Props {
  earned: EarnedAchievement[];
  destination: ExpeditionDestination;
  team: AchievementKey[];
  visitedByCreature: Map<AchievementKey, Set<string>>;
  onToggle: (key: AchievementKey) => void;
}

export default function ExpeditionCreaturePicker({
  earned,
  destination,
  team,
  visitedByCreature,
  onToggle,
}: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TeamFilter>("all");
  const full = team.length >= 3;

  const visible = useMemo(() => {
    const recommended = new Set(destination.recommendedTalents);
    return earned.filter((item) => {
      const talents = creatureTalents(item.key);
      const talentLabels = talents.map((talent) => t(`garden.talents.${talent}`));
      const name = t(`garden.creatures.${item.key}.name`);
      const intro = t(`garden.creatures.${item.key}.intro`);
      const matchesSearch = matchesAnySearchField(query, [name, intro, ...talentLabels]);
      if (!matchesSearch) return team.includes(item.key);
      if (team.includes(item.key)) return true;
      if (filter === "helpful") return talents.some((talent) => recommended.has(talent));
      if (filter === "new") return !visitedByCreature.get(item.key)?.has(destination.id);
      return true;
    });
  }, [destination.id, destination.recommendedTalents, earned, filter, query, t, team, visitedByCreature]);

  const filters: { id: TeamFilter; label: string }[] = [
    { id: "all", label: t("garden.filterAll") },
    { id: "helpful", label: t("garden.filterHelpful") },
    { id: "new", label: t("garden.filterNew") },
  ];

  return (
    <div className="expedition-map__picker">
      <div className="expedition-map__toolbar">
        <label className="expedition-map__search">
          <IconSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("garden.searchCreatures")}
            aria-label={t("garden.searchCreaturesAria")}
          />
        </label>
        <div className="expedition-map__filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`expedition-map__filter${filter === item.id ? " expedition-map__filter--active" : ""}`}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <Text size="sm" c="dimmed">{t("garden.noCreatureMatch")}</Text>
      ) : (
        <div className="expedition-map__creatures">
          {visible.map((item) => {
            const selected = team.includes(item.key);
            const talents = creatureTalents(item.key);
            const fresh = !visitedByCreature.get(item.key)?.has(destination.id);
            const helpful = talents.some((talent) => destination.recommendedTalents.includes(talent));
            const blocked = full && !selected;
            return (
              <CreatureCard
                key={item.key}
                name={t(`garden.creatures.${item.key}.name`)}
                element={item.garden_element}
                talents={talents}
                selected={selected}
                fresh={fresh}
                helpful={helpful}
                blocked={blocked}
                onToggle={() => onToggle(item.key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreatureCard({
  name,
  element,
  talents,
  selected,
  fresh,
  helpful,
  blocked,
  onToggle,
}: {
  name: string;
  element: EarnedAchievement["garden_element"];
  talents: CreatureTalent[];
  selected: boolean;
  fresh: boolean;
  helpful: boolean;
  blocked: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const talentLabel = talents.map((talent) => t(`garden.talents.${talent}`)).join(", ");
  const className = [
    "expedition-map__creature",
    selected && "expedition-map__creature--selected",
    fresh && !selected && "expedition-map__creature--fresh",
    blocked && "expedition-map__creature--blocked",
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={className}
      aria-pressed={selected}
      aria-disabled={blocked}
      aria-label={`${name}, ${talentLabel}`}
      onClick={() => {
        if (!blocked) onToggle();
      }}
    >
      <GardenSprite element={element} size={52} animated={selected} />
      <span className="expedition-map__creature-name">{name}</span>
      <span className="expedition-map__creature-talent">{talentLabel}</span>
      {(fresh || helpful) && (
        <span className="expedition-map__creature-marks">
          {helpful && <span className="expedition-map__mark expedition-map__mark--helpful">{t("garden.helpfulMark")}</span>}
          {fresh && <span className="expedition-map__mark expedition-map__mark--fresh">{t("garden.newToTrail")}</span>}
        </span>
      )}
    </button>
  );
}
