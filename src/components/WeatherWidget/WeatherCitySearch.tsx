import { Box, Group, TextInput, ActionIcon, Stack, Text } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import type { GeocodingResult } from "@/services/weatherService";
import { useCitySearch } from "@/hooks/useCitySearch";

interface WeatherCitySearchProps {
  onCitySelect: (result: GeocodingResult) => void;
  showIntroHint?: boolean;
}

export function WeatherCitySearch({ onCitySelect, showIntroHint = false }: WeatherCitySearchProps) {
  const { searchQuery, setSearchQuery, searchResults, searching, noResults, handleSearch } =
    useCitySearch();

  return (
    <Box className="weather-city-search" mt="xs">
      {showIntroHint && (
        <Text size="xs" c="dimmed" mb={6}>
          Choose a city to see the upcoming forecast.
        </Text>
      )}
      <Group gap="xs">
        <TextInput
          placeholder="Search for a city to see the forecast…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSearch();
          }}
          size="xs"
          style={{ flex: 1 }}
          styles={{ input: { borderColor: "var(--green-100)" } }}
          autoFocus
        />
        <ActionIcon
          variant="filled"
          color="green"
          size={30}
          onClick={() => void handleSearch()}
          loading={searching}
          aria-label="Search city for weather forecast"
        >
          <IconSearch size={14} />
        </ActionIcon>
      </Group>

      {noResults && (
        <Text size="xs" c="dimmed" ta="center" mt={6}>
          No cities found. Try a different name.
        </Text>
      )}

      {searchResults.length > 0 && (
        <Stack gap={0} className="weather-search-results" mt={6}>
          {searchResults.map((result) => (
            <Box
              key={result.id}
              className="weather-search-result"
              onClick={() => onCitySelect(result)}
            >
              <Text size="xs" fw={600} c="var(--green-900)">
                {result.name}
              </Text>
              <Text size="xs" c="dimmed">
                {[result.admin1, result.country].filter(Boolean).join(", ")}
              </Text>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
