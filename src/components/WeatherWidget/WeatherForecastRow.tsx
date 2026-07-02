import React from "react";
import { Group, Text, Skeleton } from "@mantine/core";
import type { WeatherForecast } from "@/services/weatherService";
import { WeatherDaySlot } from "./WeatherDaySlot";

interface WeatherForecastRowProps {
  forecast: WeatherForecast | null;
  loading: boolean;
  error: string | null;
  style?: React.CSSProperties;
}

export function WeatherForecastRow({ forecast, loading, error, style }: WeatherForecastRowProps) {
  if (error) {
    return <Text size="xs" c="red" style={style}>{error}</Text>;
  }

  if (loading) {
    return (
      <Group gap="md" wrap="nowrap" style={{ flex: 1, ...style }}>
        <Skeleton height={32} radius="sm" style={{ flex: 1 }} />
        <Skeleton height={32} radius="sm" style={{ flex: 1 }} />
        <Skeleton height={32} radius="sm" style={{ flex: 1 }} />
      </Group>
    );
  }

  if (!forecast) return null;

  return (
    <Group gap="md" wrap="nowrap" style={{ flex: 1, ...style }}>
      {forecast.map((day, i) => (
        <WeatherDaySlot key={day.date} day={day} index={i} />
      ))}
    </Group>
  );
}
