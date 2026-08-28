import { Skeleton, Stack, Text, Button, ActionIcon, Tooltip } from "@mantine/core";
import { IconBellOff, IconSun } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { EnrichedPlant, PlantStatus } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { relativeTime } from "@/utils/time";
import { plantThumbnailUrl } from "@/utils/plantDisplay";
import HumidityBar from "@/components/HumidityBar";
import FilterChip from "@/components/shared/FilterChip";
import PlantStatusChips from "@/components/shared/PlantStatusChips";

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

/** True when the last reading is older than one reporting interval (or the plant is offline). */
type TFunc = (key: string, opts?: Record<string, unknown>) => string;

function snoozeTimeLeft(isoString: string, t: TFunc): string {
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return t("plantLeaderboard.expiring");
  const hrs = Math.floor(diffMs / 3_600_000);
  const mins = Math.floor((diffMs % 3_600_000) / 60_000);
  if (hrs >= 1) return t("plantLeaderboard.hoursLeft", { hours: hrs });
  return t("plantLeaderboard.minutesLeft", { minutes: mins });
}

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
  const { t } = useTranslation();
  const SEVERITY = ["OFFLINE", "WATERING_NEEDED", "HEALTHY"] as const;
  const primaryStatus = SEVERITY.find((s) => plant.statuses.includes(s)) ?? "HEALTHY";
  const { barColor } = STATUS_CONFIG[primaryStatus];
  const timeAgo = relativeTime(plant.lastMeasuredAt, t);
  const readingStale = isReadingStale(plant);
  const thumbUrl = plantThumbnailUrl(plant);

  return (
    <div
      id={`plant-row-${plant.id}`}
      className={`leaderboard-row${highlighted ? " leaderboard-row--highlighted" : ""}`}
      style={{ animationDelay: `${index * 70}ms`, cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    >
      <div className="leaderboard-info">
        <div className="leaderboard-avatar">
          {thumbUrl ? (
            <img src={thumbUrl} alt={plant.name} />
          ) : (
            "🪴"
          )}
        </div>
        <div className="leaderboard-name-group">
          <span className="leaderboard-name-row">
            <span className="leaderboard-name">{plant.name}</span>
            {plant.is_outdoor && (
              <Tooltip label={t("plantLeaderboard.outdoorPlant")} withArrow>
                <span className="leaderboard-outdoor" aria-label={t("plantLeaderboard.outdoorPlant")} onClick={(e) => e.stopPropagation()}>
                  <IconSun size={14} color="var(--terracotta-500)" />
                </span>
              </Tooltip>
            )}
          </span>
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
          <PlantStatusChips statuses={plant.statuses} />
          {snoozedUntil && (
            <FilterChip
              variant="snooze"
              icon={<IconBellOff size={12} />}
              label={t("plantLeaderboard.snoozedWithTime", { timeLeft: snoozeTimeLeft(snoozedUntil, t) })}
              rightSection={
                <Tooltip label={t("plantLeaderboard.removeSnooze")} withArrow position="top">
                  <ActionIcon
                    component="span"
                    size={12}
                    variant="transparent"
                    color="gray"
                    aria-label={t("plantLeaderboard.removeSnooze")}
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
  const { t } = useTranslation();

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
          {emptyState?.title ?? t("plantLeaderboard.noPlantsFound")}
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
