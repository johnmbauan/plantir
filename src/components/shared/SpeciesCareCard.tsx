import { Accordion, Badge, Button, Group, Image, Paper, SimpleGrid, Stack, Text } from "@mantine/core";

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
              <Text size="xs" c="dimmed">Scientific name: {scientificName}</Text>
            )}
          </Stack>
          <Badge variant="light" color="green">Care guidance</Badge>
        </Group>

        {showImage && species.imageUrl && (
          <Image
            src={species.imageUrl}
            alt={species.displayName ?? species.scientificName ?? "Species image"}
            radius="sm"
            h={160}
            w={160}
            fit="cover"
          />
        )}

        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
          <Paper withBorder radius="sm" p="xs">
            <Text size="xs" c="dimmed">Recommended soil moisture</Text>
            <Text size="sm" fw={600}>
              {species.minSoilMoisture ?? "?"}% - {species.maxSoilMoisture ?? "?"}%
            </Text>
          </Paper>
          <Paper withBorder radius="sm" p="xs">
            <Text size="xs" c="dimmed">Recommended temperature</Text>
            <Text size="sm" fw={600}>
              {species.minTemperatureCelsius ?? "?"}°C - {species.maxTemperatureCelsius ?? "?"}°C
            </Text>
          </Paper>
        </SimpleGrid>

        <Accordion variant="contained" radius="sm">
          <Accordion.Item value="care-guidance">
            <Accordion.Control>View care guidance</Accordion.Control>
            <Accordion.Panel style={{ maxHeight: 220, overflowY: "auto" }}>
              <Stack gap={6}>
                {species.soil && <Text size="sm">Soil: <Text span fw={100}>{species.soil}</Text></Text>}
                {species.sunlight && <Text size="sm">Sunlight: <Text span fw={100}>{species.sunlight}</Text></Text>}
                {species.watering && <Text size="sm">Watering: <Text span fw={100}>{species.watering}</Text></Text>}
                {species.fertilization && <Text size="sm">Fertilization: <Text span fw={100}>{species.fertilization}</Text></Text>}
                {species.pruning && <Text size="sm">Pruning: <Text span fw={100}>{species.pruning}</Text></Text>}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        {onClear && (
          <Group gap="sm">
            <Button size="xs" variant="default" onClick={onClear}>
              Clear species
            </Button>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}
