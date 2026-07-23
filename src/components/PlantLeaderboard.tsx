import { Skeleton, Stack, Text, Button, ActionIcon, Tooltip } from "@mantine/core";
import { IconBellOff, IconLeaf, IconDroplet, IconWifiOff, IconBattery } from "@tabler/icons-react";
import type { EnrichedPlant, PlantStatus } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { relativeTime } from "@/utils/time";
import HumidityBar from "@/components/HumidityBar";
import FilterChip from "@/components/shared/FilterChip";
import type { FilterChipProps } from "@/components/shared/FilterChip";

const STATUS_CHIP: Record<PlantStatus, { variant: FilterChipProps["variant"]; icon: React.ReactNode }> = {
  HEALTHY:          { variant: "healthy",  icon: <IconLeaf    size={12} /> },
  WATERING_NEEDED:  { variant: "watering", icon: <IconDroplet size={12} /> },
  OFFLINE:          { variant: "offline",  icon: <IconWifiOff size={12} /> },
  RECHARGE_NEEDED:  { variant: "recharge", icon: <IconBattery size={12} /> },
};

function batteryColor(percent: number): string {
  if (percent < 15) return "var(--mantine-color-red-6)";
  if (percent < 30) return "var(--mantine-color-orange-6)";
  return "var(--green-500)";
}

function BatteryIcon({ percent, size = 15 }: { percent: number; size?: number }) {
  // Inner fill spans x=2.5 → 11.5 (9px wide) inside the battery body
  const fillWidth = (Math.max(0, Math.min(100, percent)) / 100) * 9;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="5.5" width="11.5" height="5" rx="1.5" />
      <path d="M12.5 7.5 H15 V8.5 H12.5" />
      {fillWidth > 0 && (
        <rect x="2.5" y="7" width={fillWidth} height="2" rx="0.5" fill="currentColor" stroke="none" />
      )}
    </svg>
  );
}

function snoozeTimeLeft(isoString: string): string {
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return "expiring";
  const hrs = Math.floor(diffMs / 3_600_000);
  const mins = Math.floor((diffMs % 3_600_000) / 60_000);
  if (hrs >= 1) return `${hrs}h left`;
  return `${mins}m left`;
}

/** True when the last reading is older than one reporting interval (or the plant is offline). */
function isReadingStale(plant: EnrichedPlant): boolean {
  if (plant.statuses.includes("OFFLINE")) return true;
  if (!plant.lastMeasuredAt) return true;
  if (plant.sleepDurationSeconds == null) return false;
  const ageMs = Date.now() - new Date(plant.lastMeasuredAt).getTime();
  return ageMs > plant.sleepDurationSeconds * 1000;
}

interface PlantLeaderboardProps {
  plants: EnrichedPlant[];
  loading: boolean;
  highlightedPlantId?: number | null;
  snoozedUntilByPlantId?: Map<number, string>;
  onPlantClick?: (plant: EnrichedPlant) => void;
  onUnsnooze?: (plantId: number) => void;
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
  snoozedUntil,
  onClick,
  onUnsnooze,
}: {
  plant: EnrichedPlant;
  index: number;
  highlighted: boolean;
  snoozedUntil?: string;
  onClick?: () => void;
  onUnsnooze?: (plantId: number) => void;
}) {
  const SEVERITY = ["OFFLINE", "WATERING_NEEDED", "HEALTHY"] as const;
  const primaryStatus = SEVERITY.find((s) => plant.statuses.includes(s)) ?? "HEALTHY";
  const { barColor } = STATUS_CONFIG[primaryStatus];
  const timeAgo = relativeTime(plant.lastMeasuredAt);
  const readingStale = isReadingStale(plant);

  return (
    <div
      id={`plant-row-${plant.id}`}
      className={`leaderboard-row${highlighted ? " leaderboard-row--highlighted" : ""}`}
      style={{ animationDelay: `${index * 70}ms`, cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    >
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
            <Text size="xs" c="dimmed" tt="capitalize">
              {plant.species.displayName ?? plant.species.scientificName ?? plant.species.sourceSpeciesId}
            </Text>
          )}
          {plant.batteryPercent != null && (
            <span
              className="leaderboard-battery"
              style={{ color: batteryColor(plant.batteryPercent) }}
            >
              <BatteryIcon percent={plant.batteryPercent} />
              {plant.batteryPercent}%
            </span>
          )}
        </div>
      </div>

      <div className="leaderboard-track-wrapper">
        <div className="leaderboard-track-row">
          <HumidityBar
            humidityPercent={plant.humidityPercent}
            threshold={plant.threshold}
            barColor={barColor}
            animationDelay={`${index * 70}ms`}
            style={{ flex: 1 }}
          />
        </div>

        <div className="leaderboard-badges-row">
          {plant.statuses.map((s) => (
            <FilterChip
              key={s}
              variant={STATUS_CHIP[s].variant}
              icon={STATUS_CHIP[s].icon}
              label={STATUS_CONFIG[s].label}
              iconOnly={s === "HEALTHY"}
            />
          ))}
          {snoozedUntil && (
            <FilterChip
              variant="snooze"
              icon={<IconBellOff size={12} />}
              label={`Snoozed · ${snoozeTimeLeft(snoozedUntil)}`}
              rightSection={
                <Tooltip label="Remove snooze" withArrow position="top">
                  <ActionIcon
                    component="span"
                    size={12}
                    variant="transparent"
                    color="gray"
                    aria-label="Remove snooze"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnsnooze?.(plant.id);
                    }}
                  >
                    ×
                  </ActionIcon>
                </Tooltip>
              }
            />
          )}
        </div>
      </div>

      <div className="leaderboard-meta">
        <span className="leaderboard-pct">
          {plant.humidityPercent != null ? `${plant.humidityPercent}%` : "—"}
        </span>
        {timeAgo && (
          <span className={`leaderboard-time${readingStale ? " leaderboard-time--stale" : ""}`}>
            {timeAgo}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PlantLeaderboard({
  plants,
  loading,
  highlightedPlantId = null,
  snoozedUntilByPlantId,
  onPlantClick,
  onUnsnooze,
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
          snoozedUntil={snoozedUntilByPlantId?.get(plant.id)}
          onClick={onPlantClick ? () => onPlantClick(plant) : undefined}
          onUnsnooze={onUnsnooze}
        />
      ))}
    </div>
  );
}
