import { useCallback, useEffect, useMemo, useState } from "react";
import { Stack } from "@mantine/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { EnrichedPlant, PlantStatus } from "@/types";
import {
  applyBatteryMeasurement,
  applyHumidityMeasurement,
  fetchPlants,
} from "@/services/plantService";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";
import supabase from "@/supabase";
import PlantFilterBar from "@/components/PlantFilterBar";
import PlantLeaderboard from "@/components/PlantLeaderboard";
import PlantDetailModal from "@/components/PlantDetailModal";
import WeatherWidget from "@/components/WeatherWidget";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import { recordDashboardVisit, showUnlockToasts } from "@/services/achievementService";
import {
  fetchActiveSnoozedPlants,
  unsnoozeNotification,
} from "@/services/notificationService";
import "@/pages/Dashboard.css";

type DashboardFilter = PlantStatus | "all";
type DashboardSort = "humidity-low" | "humidity-high" | "name" | "last-seen";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plants, setPlants] = useState<EnrichedPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");
  const [sortBy, setSortBy] = useState<DashboardSort>(() => {
    const stored = localStorage.getItem("plantir_dashboard_sort");
    const valid: DashboardSort[] = ["humidity-low", "humidity-high", "name", "last-seen"];
    return valid.includes(stored as DashboardSort) ? (stored as DashboardSort) : "humidity-low";
  });
  const [selectedPlant, setSelectedPlant] = useState<EnrichedPlant | null>(null);
  const [highlightedPlantId, setHighlightedPlantId] = useState<number | null>(null);
  const [snoozedUntilByPlantId, setSnoozedUntilByPlantId] = useState<Map<number, string>>(new Map());

  function toggleFilter(status: PlantStatus) {
    setActiveFilter((prev) => (prev === status ? "all" : status));
  }

  const reloadPlants = useCallback(async (source: "initial" | "manual" = "manual") => {
    if (source === "initial") setLoading(true);
    if (source !== "initial") setRefreshing(true);

    const snoozePromise = fetchActiveSnoozedPlants().then(
      (snoozeMap) => {
        setSnoozedUntilByPlantId(snoozeMap);
      },
      (err: unknown) => {
        console.error(err);
        notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
      },
    );

    try {
      const data = await fetchPlants();
      setPlants(data);
      setSelectedPlant((prev) => {
        if (!prev) return null;
        return data.find((p) => p.id === prev.id) ?? prev;
      });
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      if (source === "initial") setLoading(false);
      if (source !== "initial") setRefreshing(false);
    }

    await snoozePromise;
  }, []);

  useEffect(() => {
    // Initial dashboard hydration.

    void reloadPlants("initial");
  }, [reloadPlants]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void recordDashboardVisit()
        .then((newly) => showUnlockToasts(newly))
        .catch((err) => console.error("Dashboard achievement visit failed:", err));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("plantir_dashboard_sort", sortBy);
  }, [sortBy]);

  const locationSetupPrompt = searchParams.get("setLocation") === "1";

  const clearLocationSetupParam = useCallback(() => {
    if (searchParams.get("setLocation") !== "1") return;
    setSearchParams((params) => {
      params.delete("setLocation");
      return params;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!locationSetupPrompt) return;

    const scrollTimer = window.setTimeout(() => {
      document.getElementById("weather-widget")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(scrollTimer);
  }, [locationSetupPrompt]);

  useEffect(() => {
    const highlightParam = searchParams.get("highlightPlant");
    if (!highlightParam) return;

    const plantId = Number(highlightParam);
    if (!Number.isFinite(plantId)) return;

    // Apply deep-link focus state and clear query params.

    setHighlightedPlantId(plantId);
    setActiveFilter("all");
    setSearch("");
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!highlightedPlantId || loading) return;

    const plantExists = plants.some((plant) => plant.id === highlightedPlantId);
    if (!plantExists) return;

    const scrollTimer = window.setTimeout(() => {
      document.getElementById(`plant-row-${highlightedPlantId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    const clearTimer = window.setTimeout(() => setHighlightedPlantId(null), 4000);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightedPlantId, loading, plants]);

  useEffect(() => {
    let warned = false;

    const channel = supabase
      .channel("dashboard-measurements")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "humidity_measurements" },
        (payload) => {
          const row = payload.new as {
            deviceId?: number;
            humidityPercentage?: number;
            createdAt?: string;
          };
          if (
            typeof row.deviceId !== "number" ||
            typeof row.humidityPercentage !== "number" ||
            typeof row.createdAt !== "string"
          ) {
            return;
          }

          setPlants((prev) =>
            applyHumidityMeasurement(prev, {
              deviceId: row.deviceId!,
              humidityPercentage: row.humidityPercentage!,
              createdAt: row.createdAt!,
            }),
          );
          setSelectedPlant((prev) => {
            if (!prev || prev.deviceId !== row.deviceId) return prev;
            return applyHumidityMeasurement([prev], {
              deviceId: row.deviceId!,
              humidityPercentage: row.humidityPercentage!,
              createdAt: row.createdAt!,
            })[0] ?? prev;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "battery_measurements" },
        (payload) => {
          const row = payload.new as {
            deviceId?: number;
            batteryPercent?: number;
            createdAt?: string;
          };
          if (
            typeof row.deviceId !== "number" ||
            typeof row.batteryPercent !== "number" ||
            typeof row.createdAt !== "string"
          ) {
            return;
          }

          setPlants((prev) =>
            applyBatteryMeasurement(prev, {
              deviceId: row.deviceId!,
              batteryPercent: row.batteryPercent!,
              createdAt: row.createdAt!,
            }),
          );
          setSelectedPlant((prev) => {
            if (!prev || prev.deviceId !== row.deviceId) return prev;
            return applyBatteryMeasurement([prev], {
              deviceId: row.deviceId!,
              batteryPercent: row.batteryPercent!,
              createdAt: row.createdAt!,
            })[0] ?? prev;
          });
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" && !warned) {
          warned = true;
          notifications.show({
            color: "yellow",
            title: "Realtime unavailable",
            message: "Live updates are temporarily unavailable. You can still use manual refresh.",
          });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const counts = useMemo(() => ({
    healthy: plants.filter((p) => p.statuses.includes("HEALTHY")).length,
    wateringNeeded: plants.filter((p) => p.statuses.includes("WATERING_NEEDED")).length,
    offline: plants.filter((p) => p.statuses.includes("OFFLINE")).length,
    rechargeNeeded: plants.filter((p) => p.statuses.includes("RECHARGE_NEEDED")).length,
  }), [plants]);

  const oldestPlantCreatedAt = useMemo(() => {
    if (plants.length === 0) return null;
    return plants.reduce((oldest, plant) =>
      plant.created_at < oldest ? plant.created_at : oldest,
    plants[0].created_at);
  }, [plants]);

  const hasDevices = useMemo(() => plants.some((plant) => plant.deviceId != null), [plants]);

  const visible = useMemo(() => {
    const filtered = plants.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = activeFilter === "all" || p.statuses.includes(activeFilter);
      return matchesSearch && matchesFilter;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);

      if (sortBy === "last-seen") {
        const aTime = a.lastMeasuredAt ? new Date(a.lastMeasuredAt).getTime() : 0;
        const bTime = b.lastMeasuredAt ? new Date(b.lastMeasuredAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "humidity-high") {
        const aHumidity = a.humidityPercent ?? Number.NEGATIVE_INFINITY;
        const bHumidity = b.humidityPercent ?? Number.NEGATIVE_INFINITY;
        if (bHumidity !== aHumidity) return bHumidity - aHumidity;
        return a.name.localeCompare(b.name);
      }

      const aHumidity = a.humidityPercent ?? Number.POSITIVE_INFINITY;
      const bHumidity = b.humidityPercent ?? Number.POSITIVE_INFINITY;
      if (aHumidity !== bHumidity) return aHumidity - bHumidity;
      return a.name.localeCompare(b.name);
    });
  }, [plants, search, activeFilter, sortBy]);

  const emptyState = useMemo(() => {
    if (plants.length === 0) {
      return {
        title: "No plants yet",
        description: "Start by creating your first plant in Plants Center.",
        actionLabel: "Add first plant",
        onAction: () => navigate("/plants-center?tab=plants"),
      };
    }

    if (visible.length === 0) {
      return {
        title: "No plants match your filters",
        description: "Try clearing search and filters to see all plants.",
        actionLabel: "Reset filters",
        onAction: () => {
          setSearch("");
          setActiveFilter("all");
          setSortBy("humidity-low");
        },
      };
    }

    return undefined;
  }, [plants.length, visible.length, navigate]);

  const handleUnsnooze = useCallback(async (plantId: number) => {
    setSnoozedUntilByPlantId((prev) => {
      const next = new Map(prev);
      next.delete(plantId);
      return next;
    });
    try {
      await unsnoozeNotification(plantId);
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
      void reloadPlants("manual");
    }
  }, [reloadPlants]);

  return (
    <Stack gap="lg">
      <WeatherWidget
        locationSetupPrompt={locationSetupPrompt}
        onLocationSet={clearLocationSetupParam}
      />
      <OnboardingChecklist
        plantsLoaded={!loading}
        hasPlants={plants.length > 0}
        hasDevices={hasDevices}
        oldestPlantCreatedAt={oldestPlantCreatedAt}
      />
      <PlantFilterBar
        counts={counts}
        activeFilter={activeFilter}
        search={search}
        sortBy={sortBy}
        refreshing={refreshing}
        onToggleFilter={toggleFilter}
        onSearchChange={setSearch}
        onSortChange={setSortBy}
        onRefresh={() => void reloadPlants("manual")}
      />
      <PlantLeaderboard
        plants={visible}
        loading={loading}
        highlightedPlantId={highlightedPlantId}
        snoozedUntilByPlantId={snoozedUntilByPlantId}
        onPlantClick={setSelectedPlant}
        onUnsnooze={handleUnsnooze}
        emptyState={emptyState}
      />
      <PlantDetailModal
        plant={selectedPlant}
        opened={selectedPlant !== null}
        onClose={() => setSelectedPlant(null)}
      />
    </Stack>
  );
}
