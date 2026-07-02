import { useState } from "react";
import { Paper, Group, Divider } from "@mantine/core";
import type { GeocodingResult } from "@/services/weatherService";
import { useWeatherCity } from "@/hooks/useWeatherCity";
import { WeatherCityHeader } from "./WeatherCityHeader";
import { WeatherForecastRow } from "./WeatherForecastRow";
import { WeatherCitySearch } from "./WeatherCitySearch";
import "./WeatherWidget.css";

export default function WeatherWidget() {
  const { city, locationSource, forecast, loading, error, selectCity } = useWeatherCity();
  const [editMode, setEditMode] = useState(false);

  // Search panel is open on first visit (no city yet) or when the user opens it manually.
  const searchOpen = !city || editMode;

  const handleCitySelect = (result: GeocodingResult) => {
    selectCity(result);
    setEditMode(false);
  };

  return (
    <Paper className="weather-widget" px="md" py="xs" radius="md" withBorder>
      <Group gap="sm" wrap="nowrap" align="center">
        <WeatherCityHeader
          city={city}
          locationSource={locationSource}
          editMode={editMode}
          onToggleEdit={() => setEditMode((v) => !v)}
        />
        {city && (
          <>
            <Divider orientation="vertical" color="var(--green-100)" style={{ height: 32, alignSelf: "center" }} />
            <WeatherForecastRow forecast={forecast} loading={loading} error={error} style={{ flex: 1 }} />
          </>
        )}
      </Group>

      {searchOpen && <WeatherCitySearch onCitySelect={handleCitySelect} />}
    </Paper>
  );
}
