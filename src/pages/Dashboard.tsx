import { useCallback, useEffect, useMemo, useState } from "react";
import { Stack } from "@mantine/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { EnrichedPlant, PlantStatus } from "@/types";
import { fetchPlants } from "@/services/plantService";
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
  const { t } = useTranslation();
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

  const reloadPlants = useCallback(async (source: "initial" | "manual" | "realtime" = "manual") => {
    if (source === "initial") setLoading(true);
    if (source !== "initial") setRefreshing(true);

    try {
      const [data, snoozeMap] = await Promise.all([fetchPlants(), fetchActiveSnoozedPlants()]);
      setPlants(data);
      setSnoozedUntilByPlantId(snoozeMap);
      setSelectedPlant((prev) => {
        if (!prev) return null;
        return data.find((p) => p.id === prev.id) ?? prev;
      });
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    } finally {
      if (source === "initial") setLoading(false);
      if (source !== "initial") setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    // Initial dashboard hydration.

    void reloadPlants("initial");
  }, [reloadPlants]);

  useEffect(() => {
    void recordDashboardVisit()
      .then((newly) => showUnlockToasts(newly, t))
      .catch((err) => console.error("Dashboard achievement visit failed:", err));
  }, [t]);

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
    let debounceTimer: number | undefined;
    let warned = false;
    const triggerReload = () => {
      if (debounceTimer) return;
      debounceTimer = window.setTimeout(() => {
        debounceTimer = undefined;
        void reloadPlants("realtime");
      }, 800);
    };

    const channel = supabase
      .channel("dashboard-measurements")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "humidity_measurements" }, triggerReload)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "battery_measurements" }, triggerReload)
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" && !warned) {
          warned = true;
          notifications.show({
            color: "yellow",
            title: t("dashboard.realtimeUnavailable.title"),
            message: t("dashboard.realtimeUnavailable.message"),
          });
        }
      });

    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
    };
  }, [reloadPlants, t]);

  const counts = useMemo(() => ({
    healthy: plants.filter((p) => p.statuses.includes("HEALTHY")).length,
    wateringNeeded: plants.filter((p) => p.statuses.includes("WATERING_NEEDED")).length,
    offline: plants.filter((p) => p.statuses.includes("OFFLINE")).length,
    rechargeNeeded: plants.filter((p) => p.statuses.includes("RECHARGE_NEEDED")).length,
  }), [plants]);

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
        title: t("dashboard.empty.noPlantsTitle"),
        description: t("dashboard.empty.noPlantsDescription"),
        actionLabel: t("dashboard.empty.addFirstPlant"),
        onAction: () => navigate("/plants-center?tab=plants"),
      };
    }

    if (visible.length === 0) {
      return {
        title: t("dashboard.empty.noMatchTitle"),
        description: t("dashboard.empty.noMatchDescription"),
        actionLabel: t("dashboard.empty.resetFilters"),
        onAction: () => {
          setSearch("");
          setActiveFilter("all");
          setSortBy("humidity-low");
        },
      };
    }

    return undefined;
  }, [plants.length, visible.length, navigate, t]);

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
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
      void reloadPlants("manual");
    }
  }, [reloadPlants, t]);

  return (
    <Stack gap="lg">
      <WeatherWidget
        locationSetupPrompt={locationSetupPrompt}
        onLocationSet={clearLocationSetupParam}
      />
      <OnboardingChecklist />
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
