import { Group, Text, ActionIcon, Skeleton } from "@mantine/core";
import { IconMapPin, IconPencil, IconX } from "@tabler/icons-react";
import type { StoredCity, LocationSource } from "./types";

interface WeatherCityHeaderProps {
  city: StoredCity | null;
  locationSource: LocationSource;
  editMode: boolean;
  onToggleEdit: () => void;
}

export function WeatherCityHeader({ city, locationSource, editMode, onToggleEdit }: WeatherCityHeaderProps) {
  return (
    <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
      <IconMapPin
        size={13}
        color="var(--green-500)"
      />
      {locationSource === "none" ? (
        <Text className="weather-city-name">Weather forecast</Text>
      ) : city ? (
        <Text className="weather-city-name">{city.name}</Text>
      ) : (
        <Skeleton height={14} width={110} radius="sm" />
      )}
      {locationSource !== "none" && (
        <ActionIcon
          variant="subtle"
          size={22}
          onClick={onToggleEdit}
          aria-label={editMode ? "Cancel city change" : "Change city"}
          styles={{ root: { color: "var(--green-400)" } }}
        >
          {editMode ? <IconX size={12} /> : <IconPencil size={12} />}
        </ActionIcon>
      )}
    </Group>
  );
}
