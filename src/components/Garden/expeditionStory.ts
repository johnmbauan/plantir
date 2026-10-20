import type { AchievementKey } from "@/constants/achievements";
import type { UserExpedition } from "@/services/expeditionService";

type TFunc = (key: string, options?: Record<string, string>) => string;

export interface ExpeditionStory {
  story: string;
  extra: string | null;
  hook: string | null;
}

function castNames(expedition: UserExpedition, t: TFunc): Record<string, string> {
  const cast = expedition.outcome?.cast;
  const keys: (AchievementKey | undefined)[] = [
    cast?.lead ?? expedition.team[0],
    cast?.scout ?? expedition.team[1],
    cast?.anchor ?? expedition.team[2],
  ];
  const [lead, scout, anchor] = keys.map((key) => (key ? t(`garden.creatures.${key}.name`) : ""));
  return { lead, scout, anchor };
}

/** Story copy may use a blank line to separate the setting from what happens. */
export function storyParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function expeditionStory(expedition: UserExpedition, t: TFunc): ExpeditionStory | null {
  const outcome = expedition.outcome;
  if (!outcome?.chapterKey) return null;

  const names = castNames(expedition, t);
  const line = (key: string) => t(`garden.stories.${key}`, names);

  return {
    story: line(outcome.chapterKey),
    extra: outcome.extraChapterKey ? line(outcome.extraChapterKey) : null,
    hook: outcome.hookKey ? line(outcome.hookKey) : null,
  };
}
