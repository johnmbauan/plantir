import { Skeleton, Stack, Text, Group, Badge } from "@mantine/core";
import type { EnrichedPlant } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { relativeTime } from "@/utils/time";
import HumidityBar from "@/components/HumidityBar";

interface PlantLeaderboardProps {
  plants: EnrichedPlant[];
  loading: boolean;
  onPlantClick?: (plant: EnrichedPlant) => void;
}

function PlantLeaderboardRow({ plant, index, onClick }: { plant: EnrichedPlant; index: number; onClick?: () => void }) {
  const SEVERITY = ["OFFLINE", "WATERING_NEEDED", "HEALTHY"] as const;
  const primaryStatus = SEVERITY.find((s) => plant.statuses.includes(s)) ?? "HEALTHY";
  const { barColor } = STATUS_CONFIG[primaryStatus];
  const timeAgo = relativeTime(plant.lastMeasuredAt);

  return (
    <div className="leaderboard-row" key={plant.id} style={{ animationDelay: `${index * 70}ms`, cursor: onClick ? "pointer" : undefined }} onClick={onClick}>
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
          <Group gap={4}>
            {plant.statuses.map((s) => (
              <Badge key={s} color={STATUS_CONFIG[s].color} variant="light" size="xs">
                {STATUS_CONFIG[s].label}
              </Badge>
            ))}
          </Group>
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

export default function PlantLeaderboard({ plants, loading, onPlantClick }: PlantLeaderboardProps) {
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
      <Text ta="center" c="var(--green-400)" mt="xl">
        No plants found.
      </Text>
    );
  }

  return (
    <div className="leaderboard">
      {plants.map((plant, index) => (
        <PlantLeaderboardRow key={plant.id} plant={plant} index={index} onClick={onPlantClick ? () => onPlantClick(plant) : undefined} />
      ))}
    </div>
  );
}
