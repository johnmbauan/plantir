import type { DestinationCatalog, StoryChapter } from "./catalog.ts";
import {
  CREATURE_TALENTS,
  EXPEDITION_DURATIONS,
  type CreatureTalent,
  type DurationKey,
} from "./catalog.ts";

/** Talents that read as "went ahead to look": used to cast the scout. */
const SCOUT_TALENTS: CreatureTalent[] = ["observation", "navigation", "nightSight"];

export interface StoryCast {
  lead: string;
  scout: string | null;
  anchor: string | null;
}

export interface FrozenOutcome {
  chapterKey: string;
  extraChapterKey: string | null;
  hookKey: string | null;
  cast: StoryCast;
  discoveryIds: string[];
  talentMatches: string[];
  observations: { achievementKey: string; firstVisit: boolean }[];
  bondGrants: { achievementKey: string; points: number }[];
}

export interface OutcomeHistory {
  alreadyFound: Set<string>;
  visitedKeys: Set<string>;
  /** Visits to this destination that are already frozen, used to cycle repeat beats. */
  visitIndex: number;
  /** Chapter keys this user has already read on this destination. */
  usedChapterKeys: Set<string>;
}

/**
 * Casts the three story roles. The lead is whoever fits the trail best, the
 * scout is whoever is most likely to walk ahead, and the anchor is the one
 * left holding the team together. Ties fall back to team order so that a
 * frozen outcome always re-renders with the same names.
 */
export function castRoles(destination: DestinationCatalog, team: string[]): StoryCast {
  const remaining = [...team];

  const fit = (key: string) => {
    const talents = CREATURE_TALENTS[key] ?? [];
    return destination.recommendedTalents.filter((talent) => talents.includes(talent)).length;
  };

  let leadIndex = 0;
  for (let i = 1; i < remaining.length; i++) {
    if (fit(remaining[i]) > fit(remaining[leadIndex])) leadIndex = i;
  }
  const lead = remaining.splice(leadIndex, 1)[0];

  const scoutIndex = remaining.findIndex((key) =>
    (CREATURE_TALENTS[key] ?? []).some((talent) => SCOUT_TALENTS.includes(talent)),
  );
  const scout = remaining.length === 0
    ? null
    : remaining.splice(scoutIndex === -1 ? 0 : scoutIndex, 1)[0];

  return { lead, scout, anchor: remaining[0] ?? null };
}

/**
 * Picks the chapter for this return. Chapters advance with the keepsakes found
 * on the trail, so the text never runs ahead of the discoveries, and any
 * chapter already read is skipped. Once the authored arc is spent, the trail
 * falls back to its repeat beats.
 */
function pickChapters(
  destination: DestinationCatalog,
  history: OutcomeHistory,
  discoveryCount: number,
): { chapter: StoryChapter; extra: StoryChapter | null } {
  const chapters = destination.chapters;
  const found = destination.discoveryIds.filter((id) => history.alreadyFound.has(id)).length;

  const nextUnread = (from: number) => {
    let index = from;
    while (index < chapters.length && history.usedChapterKeys.has(chapters[index].key)) index += 1;
    return index;
  };

  const index = nextUnread(Math.min(found, chapters.length));
  const chapter = chapters[index];

  if (!chapter) {
    const repeats = destination.repeatChapters;
    return { chapter: repeats[history.visitIndex % repeats.length], extra: null };
  }

  const extra = discoveryCount > 1 ? chapters[nextUnread(index + 1)] ?? null : null;
  return { chapter, extra };
}

export function computeOutcome(
  destination: DestinationCatalog,
  durationKey: DurationKey,
  team: string[],
  history: OutcomeHistory,
): FrozenOutcome {
  const points = EXPEDITION_DURATIONS[durationKey].bondPoints;
  const teamTalents = new Set(team.flatMap((key) => CREATURE_TALENTS[key] ?? []));
  const talentMatches = destination.recommendedTalents.filter((talent) => teamTalents.has(talent));

  const discoveryIds: string[] = [];
  const nextGuaranteed = destination.discoveryIds.find((id) => !history.alreadyFound.has(id));
  if (nextGuaranteed) discoveryIds.push(nextGuaranteed);

  if (talentMatches.length > 0) {
    const bonus = destination.discoveryIds.find(
      (id) => !history.alreadyFound.has(id) && id !== nextGuaranteed,
    );
    if (bonus) discoveryIds.push(bonus);
  }

  const { chapter, extra } = pickChapters(destination, history, discoveryIds.length);

  return {
    chapterKey: chapter.key,
    extraChapterKey: extra?.key ?? null,
    hookKey: (extra ?? chapter).hookKey ?? null,
    cast: castRoles(destination, team),
    discoveryIds,
    talentMatches,
    observations: team.map((achievementKey) => ({
      achievementKey,
      firstVisit: !history.visitedKeys.has(`${destination.id}:${achievementKey}`),
    })),
    bondGrants: team.map((achievementKey) => ({ achievementKey, points })),
  };
}
