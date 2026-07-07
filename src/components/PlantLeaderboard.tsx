import { Skeleton, Stack, Text, Group, Badge, Button } from "@mantine/core";
import type { EnrichedPlant } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { relativeTime } from "@/utils/time";
import HumidityBar from "@/components/HumidityBar";

interface PlantLeaderboardProps {
  plants: EnrichedPlant[];
  loading: boolean;
  highlightedPlantId?: number | null;
  onPlantClick?: (plant: EnrichedPlant) => void;
  emptyState?: {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  };
}

function PlantLeaderboardRow({
  plant,
  index,
  highlighted,
  onClick,
}: {
  plant: EnrichedPlant;
  index: number;
  highlighted: boolean;
  onClick?: () => void;
}) {
  const SEVERITY = ["OFFLINE", "WATERING_NEEDED", "HEALTHY"] as const;
  const primaryStatus = SEVERITY.find((s) => plant.statuses.includes(s)) ?? "HEALTHY";
  const { barColor } = STATUS_CONFIG[primaryStatus];
  const timeAgo = relativeTime(plant.lastMeasuredAt);

  return (
    <div
      id={`plant-row-${plant.id}`}
      className={`leaderboard-row${highlighted ? " leaderboard-row--highlighted" : ""}`}
      style={{ animationDelay: `${index * 70}ms`, cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    >
      <span className="leaderboard-rank">{index + 1}</span>

      <div className="leaderboard-info">
        <div className="leaderboard-avatar">
          {plant.image_url ? (
            <img src={plant.image_url} alt={plant.name} />
          ) : (
            "🪴"
          )}
        </div>
        <div className="leaderboard-name-group">
          <span className="leaderboard-name">{plant.name}</span>
          {plant.species && (
            <Text size="xs" c="dimmed">
              {plant.species.displayName ?? plant.species.scientificName ?? plant.species.sourceSpeciesId}
            </Text>
          )}
          <Group gap={4}>
            {plant.statuses.map((s) => (
              <Badge key={s} color={STATUS_CONFIG[s].color} variant="light" size="xs">
                {STATUS_CONFIG[s].label}
              </Badge>
            ))}
          </Group>
          {plant.batteryPercent != null && (
            <span
              className="leaderboard-battery"
              style={{
                color:
                  plant.batteryPercent < 20
                    ? "var(--mantine-color-red-6)"
                    : plant.batteryPercent < 50
                      ? "var(--mantine-color-orange-6)"
                      : undefined,
              }}
            >
              🔋 {plant.batteryPercent}%
            </span>
          )}
        </div>
      </div>

      <div className="leaderboard-track-wrapper">
        <HumidityBar
          humidityPercent={plant.humidityPercent}
          threshold={plant.threshold}
          barColor={barColor}
          animationDelay={`${index * 70}ms`}
          style={{ flex: 1 }}
        />
        <div className="leaderboard-meta">
          <span className="leaderboard-pct">
            {plant.humidityPercent != null ? `${plant.humidityPercent}%` : "—"}
          </span>
          {timeAgo && (
            <span className="leaderboard-time">{timeAgo}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlantLeaderboard({
  plants,
  loading,
  highlightedPlantId = null,
  onPlantClick,
  emptyState,
}: PlantLeaderboardProps) {
  if (loading) {
    return (
      <Stack gap="sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={64} radius="md" />
        ))}
      </Stack>
    );
  }

  if (plants.length === 0) {
    return (
      <Stack align="center" gap={4} mt="xl">
        <Text ta="center" c="var(--green-700)" fw={600}>
          {emptyState?.title ?? "No plants found."}
        </Text>
        {emptyState?.description && (
          <Text ta="center" c="dimmed" size="sm">
            {emptyState.description}
          </Text>
        )}
        {emptyState?.actionLabel && emptyState.onAction && (
          <Button variant="subtle" onClick={emptyState.onAction}>
            {emptyState.actionLabel}
          </Button>
        )}
      </Stack>
    );
  }

  return (
    <div className="leaderboard">
      {plants.map((plant, index) => (
        <PlantLeaderboardRow
          key={plant.id}
          plant={plant}
          index={index}
          highlighted={plant.id === highlightedPlantId}
          onClick={onPlantClick ? () => onPlantClick(plant) : undefined}
        />
      ))}
    </div>
  );
}
