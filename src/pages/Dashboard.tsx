import { useEffect, useState } from "react";
import { Stack } from "@mantine/core";
import type { EnrichedPlant, PlantStatus } from "@/types";
import { fetchPlants } from "@/services/plantService";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";
import PlantFilterBar from "@/components/PlantFilterBar";
import PlantLeaderboard from "@/components/PlantLeaderboard";
import PlantDetailModal from "@/components/PlantDetailModal";
import "@/pages/Dashboard.css";

export default function Dashboard() {
  const [plants, setPlants] = useState<EnrichedPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PlantStatus | "all">("all");
  const [selectedPlant, setSelectedPlant] = useState<EnrichedPlant | null>(null);

  function toggleFilter(status: PlantStatus) {
    setActiveFilter((prev) => (prev === status ? "all" : status));
  }

  useEffect(() => {
    fetchPlants()
      .then(setPlants)
      .catch((err) => {
        console.error(err);
        notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    wateringNeeded: plants.filter((p) => p.statuses.includes("WATERING_NEEDED")).length,
    offline: plants.filter((p) => p.statuses.includes("OFFLINE")).length,
  };

  const visible = plants.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || p.statuses.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <Stack gap="lg">
      <PlantFilterBar
        counts={counts}
        activeFilter={activeFilter}
        search={search}
        onToggleFilter={toggleFilter}
        onSearchChange={setSearch}
      />
      <PlantLeaderboard plants={visible} loading={loading} onPlantClick={setSelectedPlant} />
      <PlantDetailModal
        plant={selectedPlant}
        opened={selectedPlant !== null}
        onClose={() => setSelectedPlant(null)}
      />
    </Stack>
  );
}
