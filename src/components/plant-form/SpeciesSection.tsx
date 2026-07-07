import { Alert, Group, Loader, Paper, Select, Skeleton, Stack, Text } from "@mantine/core";
import type { PlantSpecies } from "@/types";
import { SpeciesCareCard } from "@/components/shared/SpeciesCareCard";
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
  return (
    <>
      <Select
        aria-label="Plant species (optional)"
        placeholder="Start typing species..."
        searchable
        clearable
        searchValue={speciesQuery}
        onSearchChange={onSearchChange}
        value={selectedSpeciesId}
        data={speciesResults}
        onChange={(value) => void onSelect(value)}
        disabled={saving}
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
          <Stack gap="xs">
            <Group gap="xs" align="center">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Loading species details...</Text>
            </Group>
            <Skeleton height={16} radius="sm" />
            <Skeleton height={16} radius="sm" width="80%" />
            <Skeleton height={16} radius="sm" width="70%" />
          </Stack>
        </Paper>
      )}
      {selectedSpecies && (
        <SpeciesCareCard
          species={selectedSpecies}
          showImage
          onClear={onRejectSpecies}
        />
      )}
    </>
  );
}
