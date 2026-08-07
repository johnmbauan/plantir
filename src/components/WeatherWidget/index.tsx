import { useEffect, useState } from "react";
import { Paper, Group, Divider } from "@mantine/core";
import type { GeocodingResult } from "@/services/weatherService";
import { useWeatherCity } from "@/context/WeatherCityContext";
import { WeatherCityHeader } from "./WeatherCityHeader";
import { WeatherForecastRow } from "./WeatherForecastRow";
import { WeatherCitySearch } from "./WeatherCitySearch";
import "./WeatherWidget.css";

interface WeatherWidgetProps {
  locationSetupPrompt?: boolean;
  onLocationSet?: () => void;
}

export default function WeatherWidget({
  locationSetupPrompt = false,
  onLocationSet,
}: WeatherWidgetProps) {
  const { city, locationSource, forecast, loading, error, selectCity, ensureForecast } =
    useWeatherCity();
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    ensureForecast();
  }, [ensureForecast]);

  // Search panel is open on first visit (no city yet) or when the user opens it manually.
  const searchOpen = !city || editMode;

  const handleCitySelect = (result: GeocodingResult) => {
    selectCity(result);
    setEditMode(false);
    onLocationSet?.();
  };

  return (
    <Paper id="weather-widget" className="weather-widget" px="md" py="xs" radius="md" withBorder>
      <Group gap="sm" wrap="nowrap" align="center" className="weather-widget-row">
        <WeatherCityHeader
          city={city}
          locationSource={locationSource}
          editMode={editMode}
          onToggleEdit={() => setEditMode((v) => !v)}
        />
        {city && (
          <>
            <Divider orientation="vertical" color="var(--green-100)" className="weather-widget-divider" style={{ height: 32, alignSelf: "center" }} />
            <WeatherForecastRow forecast={forecast} loading={loading} error={error} style={{ flex: 1 }} />
          </>
        )}
      </Group>

      {searchOpen && (
        <WeatherCitySearch
          onCitySelect={handleCitySelect}
          showIntroHint={!city}
          showLocationSetupHint={locationSetupPrompt && !city}
        />
      )}
    </Paper>
  );
}
