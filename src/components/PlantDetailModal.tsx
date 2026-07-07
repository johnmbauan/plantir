import { useCallback, useEffect, useState } from "react";
import { Modal, Image, Group, Text, Stack, Anchor, Box, Badge, SegmentedControl, Alert, Loader, Skeleton, LoadingOverlay, Divider, Paper } from "@mantine/core";
import { Link } from "react-router-dom";
import type { EnrichedPlant, HistoryRange, PlantHistory } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { formatInterval } from "@/utils/time";
import HumidityBar from "@/components/HumidityBar";
import HistoryLineChart from "@/components/HistoryLineChart";
import { fetchPlantHistory } from "@/services/plantService";
import { getErrorMessage } from "@/utils/error";

interface Props {
  plant: EnrichedPlant | null;
  opened: boolean;
  onClose: () => void;
}

export default function PlantDetailModal({ plant, opened, onClose }: Props) {
  const [range, setRange] = useState<HistoryRange>("24h");
  const [history, setHistory] = useState<PlantHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async (plantId: number, selectedRange: HistoryRange) => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const data = await fetchPlantHistory(plantId, selectedRange);
      setHistory(data);
    } catch (error) {
      setHistoryError(getErrorMessage(error));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!opened || !plant?.deviceId) return;
    // Loading depends on runtime plant/range state and is intentionally effect-driven.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory(plant.id, range);
  }, [opened, plant?.id, plant?.deviceId, range, loadHistory]);

  if (!plant) return null;

  const SEVERITY = ["OFFLINE", "WATERING_NEEDED", "HEALTHY"] as const;
  const primaryStatus = SEVERITY.find((s) => plant.statuses.includes(s)) ?? "HEALTHY";
  const { barColor } = STATUS_CONFIG[primaryStatus];
  const primarySpeciesName = plant.species?.displayName
    ?? plant.species?.scientificName
    ?? plant.species?.sourceSpeciesId
    ?? "";
  const scientificName = plant.species?.scientificName?.trim() ?? null;
  const showScientificName = scientificName != null && scientificName.toLowerCase() !== primarySpeciesName.toLowerCase();

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>{plant.name}</Text>} size="md">
      <Stack gap="md">
        {/* Image */}
        {plant.image_url ? (
          <Image src={plant.image_url} alt={plant.name} radius="md" h={400} fit="contain" />
        ) : (
          <Box ta="center" py="md" style={{ fontSize: 72 }}>🪴</Box>
        )}

        {/* Status badges */}
        <Group gap={6}>
          {plant.statuses.map((s) => (
            <Badge key={s} color={STATUS_CONFIG[s].color} variant="light">
              {STATUS_CONFIG[s].label}
            </Badge>
          ))}
        </Group>

        {/* Humidity bar */}
        <Stack gap={6}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Humidity</Text>
            <Text size="sm" fw={600}>
              {plant.humidityPercent != null ? `${plant.humidityPercent}%` : "—"}
            </Text>
          </Group>
          <HumidityBar
            humidityPercent={plant.humidityPercent}
            threshold={plant.threshold}
            barColor={barColor}
          />
        </Stack>

        {/* Reporting interval */}
        {plant.sleepDurationSeconds != null && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Reporting interval</Text>
            <Text size="sm" fw={600}>{formatInterval(plant.sleepDurationSeconds)}</Text>
          </Group>
        )}

        {/* Battery */}
        {plant.batteryPercent != null && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Battery</Text>
            <Text
              size="sm"
              fw={600}
              c={plant.batteryPercent < 20 ? "red" : plant.batteryPercent < 50 ? "orange" : undefined}
            >
              🔋 {plant.batteryPercent}%
            </Text>
          </Group>
        )}

        {/* Species guidance */}
        {plant.species && (
          <>
            <Divider />
            <Paper withBorder p="sm" radius="md" style={{ borderColor: "var(--mantine-color-gray-3)" }}>
              <Stack gap={8}>
                <Text size="sm" tt="capitalize" fw={600}>{primarySpeciesName}</Text>
                {showScientificName && (
                  <Text size="sm">Scientific name: {scientificName}</Text>
                )}
                <Text size="sm">
                  Recommended soil moisture 💧: <Text span fw={100}>{plant.species.minSoilMoisture ?? "?"}% - {plant.species.maxSoilMoisture ?? "?"}%</Text>
                </Text>
                <Text size="sm">
                  Recommended temperature 🌡️: <Text span fw={100}>{plant.species.minTemperatureCelsius ?? "?"}°C - {plant.species.maxTemperatureCelsius ?? "?"}°C</Text>
                </Text>
                {plant.species.soil && <Text size="sm">Soil 🌱: <Text span fw={100}>{plant.species.soil}</Text></Text>}
                {plant.species.sunlight && <Text size="sm">Sunlight ☀️: <Text span fw={100}>{plant.species.sunlight}</Text></Text>}
                {plant.species.watering && <Text size="sm">Watering 🚿: <Text span fw={100}>{plant.species.watering}</Text></Text>}
                {plant.species.fertilization && <Text size="sm">Fertilization 🧪: <Text span fw={100}>{plant.species.fertilization}</Text></Text>}
                {plant.species.pruning && <Text size="sm">Pruning ✂️: <Text span fw={100}>{plant.species.pruning}</Text></Text>}
              </Stack>
            </Paper>
          </>
        )}

        {/* Action links */}
        <Group gap="lg" mt="xs">
          <Anchor component={Link} size="sm" to={`/plants-center?tab=plants&plantId=${plant.id}`} onClick={onClose}>
            ✏️ Edit plant
          </Anchor>
          {plant.deviceId != null && (
            <Anchor component={Link} size="sm" to={`/plants-center?tab=devices&deviceId=${plant.deviceId}`} onClick={onClose}>
              🔧 Edit device
            </Anchor>
          )}
        </Group>

        {/* History */}
        {plant.deviceId != null && (
          <Stack gap="xs">
            <Group justify="space-between" align="end">
              <Text size="sm" fw={600}>Measurement history</Text>
              <SegmentedControl
                size="xs"
                value={range}
                onChange={(value) => setRange(value as HistoryRange)}
                data={[
                  { label: "24h", value: "24h" },
                  { label: "7d", value: "7d" },
                  { label: "30d", value: "30d" },
                ]}
              />
            </Group>

            {historyError && !historyLoading && (
              <Alert color="red" variant="light">
                {historyError}
              </Alert>
            )}

            {!history && historyLoading && (
              <Stack gap="sm">
                <Skeleton h={178} radius="md" />
                <Skeleton h={178} radius="md" />
              </Stack>
            )}

            {history && !historyError && (
              <Stack gap="sm" pos="relative" mih={360}>
                <LoadingOverlay
                  visible={historyLoading}
                  loaderProps={{ children: <Loader size="sm" /> }}
                  overlayProps={{ radius: "sm", blur: 1, backgroundOpacity: 0.35 }}
                />
                <HistoryLineChart
                  title="Humidity trend"
                  points={history.humidity}
                  color="var(--terracotta-500)"
                  unit="%"
                />
                <HistoryLineChart
                  title="Battery trend"
                  points={history.battery}
                  color="var(--mantine-color-green-6)"
                  unit="%"
                />
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
