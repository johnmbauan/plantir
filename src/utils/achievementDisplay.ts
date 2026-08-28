import i18n from "@/i18n";

export function achievementCopy(
  key: string,
  fallback: { name?: string; description?: string } = {},
): { name: string; description: string } {
  return {
    name: i18n.t(`garden.achievements.${key}.name`, {
      defaultValue: fallback.name ?? key,
    }),
    description: i18n.t(`garden.achievements.${key}.description`, {
      defaultValue: fallback.description ?? "",
    }),
  };
}
