import { useEffect, useState } from "react";
import { TextInput, Group, Badge, Skeleton, Text, Stack } from "@mantine/core";
import type { EnrichedPlant, PlantStatus } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { relativeTime } from "@/utils/time";
import { fetchPlants } from "@/services/plantService";
import "@/pages/Dashboard.css";

export default function Dashboard() {
  const [plants, setPlants] = useState<EnrichedPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PlantStatus | "all">("all");

  function toggleFilter(status: PlantStatus) {
    setActiveFilter((prev) => (prev === status ? "all" : status));
  }

  useEffect(() => {
    fetchPlants()
      .then(setPlants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    wateringNeeded: plants.filter((p) => p.status === "WATERING_NEEDED").length,
    offline: plants.filter((p) => p.status === "OFFLINE").length,
  };

  const visible = plants.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || p.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Stack gap="lg">
      {/* Filter badges */}
      <Group gap="sm" className="dashboard-summary">
        <Badge
          color="orange"
          variant={activeFilter === "WATERING_NEEDED" ? "filled" : "light"}
          size="lg"
          className={`dashboard-filter-badge${activeFilter === "WATERING_NEEDED" ? " dashboard-filter-badge--active" : ""}`}
          onClick={() => toggleFilter("WATERING_NEEDED")}
        >
          💧 {counts.wateringNeeded} need watering
        </Badge>
        <Badge
          color="gray"
          variant={activeFilter === "OFFLINE" ? "filled" : "light"}
          size="lg"
          className={`dashboard-filter-badge${activeFilter === "OFFLINE" ? " dashboard-filter-badge--active" : ""}`}
          onClick={() => toggleFilter("OFFLINE")}
        >
          ⚠️ {counts.offline} offline
        </Badge>
      </Group>

      {/* Search */}
      <TextInput
        placeholder="Search plants…"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ maxWidth: 320 }}
        styles={{ input: { borderColor: "var(--green-100)" } }}
      />

      {/* Leaderboard */}
      {loading ? (
        <Stack gap="sm">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={64} radius="md" />
          ))}
        </Stack>
      ) : visible.length === 0 ? (
        <Text ta="center" c="var(--green-400)" mt="xl">
          No plants found.
        </Text>
      ) : (
        <div className="leaderboard">
          {visible.map((plant, index) => {
            const { label, color, barColor } = STATUS_CONFIG[plant.status];
            const timeAgo = relativeTime(plant.lastMeasuredAt);
            return (
              <div className="leaderboard-row" key={plant.id} style={{ animationDelay: `${index * 70}ms` }}>
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
                    <Badge color={color} variant="light" size="xs">
                      {label}
                    </Badge>
                  </div>
                </div>

                <div className="leaderboard-track-wrapper">
                  <div className="leaderboard-track">
                    <div
                      className="leaderboard-fill"
                      style={{ width: `${plant.humidityPercent ?? 0}%`, background: barColor, animationDelay: `${index * 70}ms` }}
                    />
                    {plant.threshold != null && (
                      <div
                        className="leaderboard-threshold"
                        style={{ left: `${plant.threshold}%` }}
                      >
                        <span className="leaderboard-threshold-label">
                          {plant.threshold}%
                        </span>
                      </div>
                    )}
                  </div>
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
          })}
        </div>
      )}
    </Stack>
  );
}
