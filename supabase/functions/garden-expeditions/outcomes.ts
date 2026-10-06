import type { DestinationCatalog } from "./catalog.ts";
import { CREATURE_TALENTS, EXPEDITION_DURATIONS, type DurationKey } from "./catalog.ts";

export interface FrozenOutcome {
  storyKey: string;
  extraStoryKey: string | null;
  discoveryIds: string[];
  talentMatches: string[];
  observations: { achievementKey: string; firstVisit: boolean }[];
  bondGrants: { achievementKey: string; points: number }[];
}

export function computeOutcome(
  destination: DestinationCatalog,
  durationKey: DurationKey,
  team: string[],
  alreadyFound: Set<string>,
  visitedKeys: Set<string>,
): FrozenOutcome {
  const points = EXPEDITION_DURATIONS[durationKey].bondPoints;
  const teamTalents = new Set(team.flatMap((key) => CREATURE_TALENTS[key] ?? []));
  const talentMatches = destination.recommendedTalents.filter((talent) => teamTalents.has(talent));

  const discoveryIds: string[] = [];
  const nextGuaranteed = destination.discoveryIds.find((id) => !alreadyFound.has(id));
  if (nextGuaranteed) discoveryIds.push(nextGuaranteed);

  if (talentMatches.length > 0) {
    const bonus = destination.discoveryIds.find((id) => !alreadyFound.has(id) && id !== nextGuaranteed);
    if (bonus) discoveryIds.push(bonus);
  }

  return {
    storyKey: destination.id,
    extraStoryKey: talentMatches.length > 0 ? destination.extraStoryKey ?? null : null,
    discoveryIds,
    talentMatches,
    observations: team.map((achievementKey) => ({
      achievementKey,
      firstVisit: !visitedKeys.has(`${destination.id}:${achievementKey}`),
    })),
    bondGrants: team.map((achievementKey) => ({ achievementKey, points })),
  };
}
