import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Group,
  ActionIcon,
  Stack,
  Text,
  Badge,
  Avatar,
  Skeleton,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { fetchPlants } from "@/services/plantService";
import type { EnrichedPlant } from "@/types";
import { STATUS_CONFIG } from "@/constants/plantStatus";
import { getErrorMessage } from "@/utils/error";
import PlantFormModal from "@/components/PlantFormModal";
import PlantDeleteModal from "@/components/PlantDeleteModal";

export default function PlantsTab({ reloadKey, onMutated }: { reloadKey: number; onMutated: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [plants, setPlants] = useState<EnrichedPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const visible = useMemo(() => {
    return plants
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [plants, search]);

  return (
    <Stack gap="md" pos="relative">
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          Plants
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => handleOpenEdit()}>
          Add Plant
        </Button>
      </Group>

      <TextInput
        placeholder="Search plants…"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ maxWidth: 320, width: "100%" }}
      />

      <Table.ScrollContainer minWidth={500}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th className="col-hide-mobile">Image URL</Table.Th>
              <Table.Th w={100}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={80} /></Table.Td>
                  <Table.Td className="col-hide-mobile"><Skeleton height={16} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={60} /></Table.Td>
                </Table.Tr>
              ))
            ) : visible.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
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
                <Table.Tr key={plant.id}>
                  <Table.Td fw={500}>{plant.name}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {plant.statuses.map((s) => (
                        <Badge key={s} color={STATUS_CONFIG[s].color}>
                          {STATUS_CONFIG[s].label}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td className="col-hide-mobile">
                    <Group gap="xs" wrap="nowrap">
                      <Avatar
                        src={plant.image_url ?? undefined}
                        radius="xl"
                        size="sm"
                        alt={plant.name}
                      >
                        🪴
                      </Avatar>
                      {plant.image_url ? (
                        <Text size="sm" truncate maw={200}>
                          {plant.image_url}
                        </Text>
                      ) : (
                        <Text size="sm" c="dimmed">
                          None
                        </Text>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon variant="subtle" color="blue" aria-label="Edit plant" onClick={() => handleOpenEdit(plant)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" aria-label="Delete plant" onClick={() => handleDeletePrompt(plant)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
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
