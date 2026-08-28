import { useEffect, useState } from "react";
import { Accordion, Badge, Button, Group, Image, Paper, SimpleGrid, Skeleton, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { fetchSpeciesTranslation, type SpeciesCareTranslation } from "@/services/plantSpeciesService";

export interface SpeciesCareFields {
  displayName?: string | null;
  scientificName?: string | null;
  sourceSpeciesId?: string;
  imageUrl?: string | null;
  minSoilMoisture?: number | null;
  maxSoilMoisture?: number | null;
  minTemperatureCelsius?: number | null;
  maxTemperatureCelsius?: number | null;
  soil?: string | null;
  sunlight?: string | null;
  watering?: string | null;
  fertilization?: string | null;
  pruning?: string | null;
}

interface SpeciesCareCardProps {
  species: SpeciesCareFields;
  showImage?: boolean;
  onClear?: () => void;
}

export function SpeciesCareCard({ species, showImage = false, onClear }: SpeciesCareCardProps) {
  const { t } = useTranslation();
  const { locale } = useLanguage();

  const [translation, setTranslation] = useState<SpeciesCareTranslation | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (locale === "en" || !species.sourceSpeciesId) {
      return;
    }

    let cancelled = false;
    setTranslating(true);

    fetchSpeciesTranslation(species.sourceSpeciesId, locale)
      .then((result) => {
        if (!cancelled) setTranslation(result);
      })
      .catch(() => {
        // fall back to English on error
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [species.sourceSpeciesId, locale]);

  const care = locale !== "en" && species.sourceSpeciesId && translation ? translation : species;

  const scientificName = species.scientificName?.trim() ?? null;
  const primaryName = species.displayName ?? scientificName ?? species.sourceSpeciesId ?? "";
  const showScientificName = scientificName != null && scientificName.toLowerCase() !== primaryName.toLowerCase();

  return (
    <Paper withBorder p="sm" radius="md" style={{ borderColor: "var(--mantine-color-gray-3)" }}>
      <Stack gap="sm">
        <Group justify="space-between" align="start">
          <Stack gap={2}>
            <Text size="sm" tt="capitalize" fw={600}>{primaryName}</Text>
            {showScientificName && (
              <Text size="xs" c="dimmed">{t("species.scientificName", { name: scientificName })}</Text>
            )}
          </Stack>
          <Badge variant="light" color="green">{t("species.careGuidanceBadge")}</Badge>
        </Group>

        {showImage && species.imageUrl && (
          <Image
            src={species.imageUrl}
            alt={species.displayName ?? species.scientificName ?? t("species.speciesImageAlt")}
            radius="sm"
            h={160}
            w={160}
            fit="cover"
          />
        )}

        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
          <Paper withBorder radius="sm" p="xs">
            <Text size="xs" c="dimmed">{t("species.recommendedSoilMoisture")}</Text>
            <Text size="sm" fw={600}>
              {species.minSoilMoisture ?? "?"}% - {species.maxSoilMoisture ?? "?"}%
            </Text>
          </Paper>
          <Paper withBorder radius="sm" p="xs">
            <Text size="xs" c="dimmed">{t("species.recommendedTemperature")}</Text>
            <Text size="sm" fw={600}>
              {species.minTemperatureCelsius ?? "?"}°C - {species.maxTemperatureCelsius ?? "?"}°C
            </Text>
          </Paper>
        </SimpleGrid>

        <Accordion variant="contained" radius="sm">
          <Accordion.Item value="care-guidance">
            <Accordion.Control>{t("species.viewCareGuidance")}</Accordion.Control>
            <Accordion.Panel>
              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {translating ? (
                  <Stack gap={6}>
                    <Text size="sm" c="dimmed">{t("species.translationLoading")}</Text>
                    <Skeleton height={12} radius="sm" />
                    <Skeleton height={12} radius="sm" width="80%" />
                    <Skeleton height={12} radius="sm" width="90%" />
                  </Stack>
                ) : (
                  <Stack gap={6}>
                    {care.soil && (
                      <Text size="sm">{t("species.soil")} <Text span fw={100}>{care.soil}</Text></Text>
                    )}
                    {care.sunlight && (
                      <Text size="sm">{t("species.sunlight")} <Text span fw={100}>{care.sunlight}</Text></Text>
                    )}
                    {care.watering && (
                      <Text size="sm">{t("species.watering")} <Text span fw={100}>{care.watering}</Text></Text>
                    )}
                    {care.fertilization && (
                      <Text size="sm">{t("species.fertilization")} <Text span fw={100}>{care.fertilization}</Text></Text>
                    )}
                    {care.pruning && (
                      <Text size="sm">{t("species.pruning")} <Text span fw={100}>{care.pruning}</Text></Text>
                    )}
                  </Stack>
                )}
              </div>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        {onClear && (
          <Group gap="sm">
            <Button size="xs" variant="default" onClick={onClear}>
              {t("species.clearSpecies")}
            </Button>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
