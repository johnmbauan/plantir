import { Group, Stack, Text } from "@mantine/core";
import type { DayForecast } from "@/services/weatherService";
import { getWeatherInfo, formatDayLabel, formatShortDate } from "./utils";

interface WeatherDaySlotProps {
  day: DayForecast;
  index: number;
}

export function WeatherDaySlot({ day, index }: WeatherDaySlotProps) {
  const { WeatherIcon, color } = getWeatherInfo(day.weatherCode);
  return (
    <Group gap={6} className={`weather-day-slot${index === 0 ? " weather-day-slot--today" : ""}`} wrap="nowrap">
      <WeatherIcon size={20} color={color} style={{ flexShrink: 0 }} />
      <Stack gap={1}>
        <Group gap={3} wrap="nowrap">
          <Text className="weather-day-label">{formatDayLabel(day.date, index)}</Text>
          <Text className="weather-date-sub">{formatShortDate(day.date)}</Text>
        </Group>
        <Group gap={2} wrap="nowrap">
          <Text className="weather-temp-high">{day.maxTemp}°</Text>
          <Text className="weather-temp-sep">/</Text>
          <Text className="weather-temp-low">{day.minTemp}°</Text>
        </Group>
      </Stack>
    </Group>
  );
}
