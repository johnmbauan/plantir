import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { fetchPlants } from "@/services/plantService";
import type { EnrichedPlant } from "@/types";
import { getErrorMessage } from "@/utils/error";
import type { SortDirection } from "@/utils/sort";
import { nextSortState } from "@/utils/sort";
import PlantFormModal from "@/components/PlantFormModal";
import PlantDeleteModal from "@/components/PlantDeleteModal";
import PlantTableRow from "@/components/PlantsTab/PlantTableRow";
import {
  plantMatchesSearch,
  sortPlantsByColumn,
  type PlantsTabSortKey,
} from "@/components/PlantsTab/utils";
import PlantFilterSearch from "@/components/PlantFilterSearch";
import { SortableTh } from "@/components/shared/SortableTh";
import { TableLoadingRows } from "@/components/shared/TableLoadingRows";

const COLUMN_COUNT = 5;

const SORTABLE_COLUMNS: { key: PlantsTabSortKey; label: string; className?: string }[] = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "moisture", label: "Moisture" },
  { key: "device", label: "Assigned Device", className: "col-hide-mobile" },
];

export default function PlantsTab({ reloadKey, onMutated }: { reloadKey: number; onMutated: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [plants, setPlants] = useState<EnrichedPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<PlantsTabSortKey>("name");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const [editingPlant, setEditingPlant] = useState<EnrichedPlant | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const [plantToDelete, setPlantToDelete] = useState<EnrichedPlant | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPlants();
      setPlants(data);
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (plant?: EnrichedPlant) => {
    setEditingPlant(plant ?? null);
    open();
  };

  useEffect(() => {
    void loadData();
  }, [reloadKey]);

  useEffect(() => {
    const editPlantId = searchParams.get("plantId");
    if (!editPlantId || loading || plants.length === 0) return;
    const plant = plants.find((p) => p.id === Number(editPlantId));
    if (plant) {
      // Open edit modal from URL deep-link once data is ready.
      handleOpenEdit(plant);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("plantId");
        return next;
      }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, plants]);

  const handleDeletePrompt = (plant: EnrichedPlant) => {
    setPlantToDelete(plant);
    openDelete();
  };

  const handleSort = (key: string) => {
    const next = nextSortState(sortKey, sortDir, key as PlantsTabSortKey);
    setSortKey(next.sortKey);
    setSortDir(next.sortDir);
  };

  const openDevice = (deviceId: number) => {
    setSearchParams(
      { tab: "devices", deviceId: String(deviceId) },
      { replace: true },
    );
  };

  const assignDevice = () => {
    setSearchParams({ tab: "devices" }, { replace: true });
  };

  const visible = useMemo(() => {
    const filtered = plants.filter((p) => plantMatchesSearch(p, search));
    return sortPlantsByColumn(filtered, sortKey, sortDir);
  }, [plants, search, sortKey, sortDir]);

  return (
    <Stack gap="md" pos="relative">
      <div className="filter-toolbar center-tab-toolbar">
        <PlantFilterSearch value={search} onChange={setSearch} />
        <div className="center-tab-toolbar__actions" data-testid="center-tab-toolbar-actions">
          <Button leftSection={<IconPlus size={16} />} onClick={() => handleOpenEdit()}>
            Add Plant
          </Button>
        </div>
      </div>

      <Table.ScrollContainer minWidth={560}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              {SORTABLE_COLUMNS.map((col) => (
                <SortableTh
                  key={col.key}
                  label={col.label}
                  columnKey={col.key}
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                  className={col.className}
                />
              ))}
              <Table.Th w={100}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <TableLoadingRows rowCount={4} columnCount={COLUMN_COUNT} />
            ) : visible.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={COLUMN_COUNT}>
                  <Stack align="center" gap="xs" py="xl">
                    {plants.length === 0 ? (
                      <>
                        <Text fw={500}>No plants yet</Text>
                        <Text size="sm" c="dimmed" ta="center" maw={320}>
                          Add a plant to start tracking its humidity. Give it a name and optionally a photo.
                        </Text>
                        <Button
                          size="sm"
                          mt="xs"
                          leftSection={<IconPlus size={14} />}
                          onClick={() => handleOpenEdit()}
                        >
                          Add your first plant
                        </Button>
                      </>
                    ) : (
                      <Text size="sm" c="dimmed">No plants match your search.</Text>
                    )}
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              visible.map((plant) => (
                <PlantTableRow
                  key={plant.id}
                  plant={plant}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeletePrompt}
                  onOpenDevice={openDevice}
                  onAssignDevice={assignDevice}
                />
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <PlantFormModal
        opened={opened}
        onClose={close}
        editingPlant={editingPlant}
        onSaved={onMutated}
      />

      <PlantDeleteModal
        opened={deleteOpened}
        onClose={closeDelete}
        plant={plantToDelete}
        onDeleted={onMutated}
      />
    </Stack>
  );
}
