import { Alert, Badge, Button, Group, Image, Loader, Paper, Select, Stack, Text } from "@mantine/core";
import type { PlantSpecies } from "@/types";
import type { PlantSpeciesOption } from "./usePlantSpeciesSelection";

interface SpeciesSectionProps {
  speciesQuery: string;
  speciesResults: PlantSpeciesOption[];
  selectedSpeciesId: string | null;
  selectedSpecies: PlantSpecies | null;
  speciesSearchLoading: boolean;
  speciesDetailLoading: boolean;
  speciesError: string | null;
  saving: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (sourceSpeciesId: string | null) => void;
  onRejectSpecies: () => void;
}

export function SpeciesSection({
  speciesQuery,
  speciesResults,
  selectedSpeciesId,
  selectedSpecies,
  speciesSearchLoading,
  speciesDetailLoading,
  speciesError,
  saving,
  onSearchChange,
  onSelect,
  onRejectSpecies,
}: SpeciesSectionProps) {
  const scientificName = selectedSpecies?.scientificName?.trim() ?? null;
  const primaryName = selectedSpecies?.displayName ?? scientificName ?? selectedSpecies?.sourceSpeciesId ?? "";
  const showScientificName = scientificName != null && scientificName.toLowerCase() !== primaryName.toLowerCase();

  return (
    <>
      <Select
        label={
          <Group gap={6} align="center">
            <Text size="sm" fw={500}>Plant species (optional)</Text>
          </Group>
        }
        placeholder="Start typing species..."
        searchable
        clearable
        searchValue={speciesQuery}
        onSearchChange={onSearchChange}
        value={selectedSpeciesId}
        data={speciesResults}
        onChange={(value) => void onSelect(value)}
        disabled={saving}
        description="Recommended: provide species to unlock care guidance."
        nothingFoundMessage={
          speciesQuery.trim().length < 2
            ? "Type at least 2 characters"
            : speciesSearchLoading
              ? "Searching..."
              : "No matches"
        }
        rightSection={speciesSearchLoading ? <Loader size="xs" /> : null}
        rightSectionPointerEvents="none"
      />
      {speciesSearchLoading && (
        <Text size="xs" c="dimmed">
          Searching species...
        </Text>
      )}
      {speciesError && (
        <Alert color="red" variant="light">
          {speciesError}
        </Alert>
      )}
      {selectedSpeciesId && speciesDetailLoading && !selectedSpecies && (
        <Paper withBorder p="sm" radius="md" style={{ borderColor: "var(--mantine-color-gray-3)" }}>
          <Group gap="xs" align="center">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Loading species details...</Text>
          </Group>
        </Paper>
      )}
      {selectedSpecies && (
        <Paper withBorder p="sm" radius="md" style={{ borderColor: "var(--mantine-color-gray-3)", marginTop: 4 }}>
          <Stack gap={8}>
            <Group justify="space-between" align="start">
              <Stack gap={2}>
                <Text size="md" fw={600} tt="capitalize">{primaryName}</Text>
                {showScientificName && (
                  <Text size="sm">Scientific name: {scientificName}</Text>
                )}
              </Stack>
              <Badge color="green" variant="light">Matched</Badge>
            </Group>
            {selectedSpecies.imageUrl && (
              <Image
                src={selectedSpecies.imageUrl}
                alt={selectedSpecies.displayName ?? selectedSpecies.scientificName ?? "Species image"}
                radius="sm"
                h={120}
                w={120}
                fit="cover"
              />
            )}
            <Text size="md" fw={600}>Care information</Text>
            <Text size="sm">
              Recommended soil moisture 💧: <Text span fw={200}>{selectedSpecies.minSoilMoisture ?? "?"}% - {selectedSpecies.maxSoilMoisture ?? "?"}%</Text>
            </Text>
            <Text size="sm">
              Recommended temperature 🌡️: <Text span fw={200}>{selectedSpecies.minTemperatureCelsius ?? "?"}°C - {selectedSpecies.maxTemperatureCelsius ?? "?"}°C</Text>
            </Text>
            {selectedSpecies.soil && <Text size="sm">Soil 🌱: <Text span fw={200}>{selectedSpecies.soil}</Text></Text>}
            {selectedSpecies.sunlight && <Text size="sm">Sunlight ☀️: <Text span fw={200}>{selectedSpecies.sunlight}</Text></Text>}
            {selectedSpecies.watering && <Text size="sm">Watering 🚿: <Text span fw={200}>{selectedSpecies.watering}</Text></Text>}
            {selectedSpecies.fertilization && <Text size="sm">Fertilization 🧪: <Text span fw={200}>{selectedSpecies.fertilization}</Text></Text>}
            {selectedSpecies.pruning && <Text size="sm">Pruning ✂️: <Text span fw={200}>{selectedSpecies.pruning}</Text></Text>}
          </Stack>
          <Group gap="sm" mt="md">
            <Button size="xs" variant="default" onClick={onRejectSpecies}>
              Not this plant
            </Button>
          </Group>
        </Paper>
      )}
    </>
  );
}
