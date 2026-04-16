import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Group,
  ActionIcon,
  Stack,
  Text,
  Skeleton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { fetchDevices } from "@/services/deviceService";
import { notifications } from "@mantine/notifications";
import { fetchPlants } from "@/services/plantService";
import type { Device, EnrichedPlant } from "@/types";
import { getErrorMessage } from "@/utils/error";
import DeviceFormModal from "@/components/DeviceFormModal";
import DeviceDeleteModal from "@/components/DeviceDeleteModal";

export default function DevicesTab({ reloadKey, onMutated }: { reloadKey: number; onMutated: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [plants, setPlants] = useState<EnrichedPlant[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deviceData, plantData] = await Promise.all([fetchDevices(), fetchPlants()]);
      setDevices(deviceData);
      setPlants(plantData);
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    const editDeviceId = searchParams.get("deviceId");
    if (!editDeviceId || loading || devices.length === 0) return;
    const device = devices.find((d) => d.id === Number(editDeviceId));
    if (device) {
      handleOpenEdit(device);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("deviceId");
        return next;
      }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, devices]);

  const plantOptions = plants.map((p) => ({ value: String(p.id), label: p.name }));

  const handleOpenEdit = (device?: Device) => {
    setEditingDevice(device ?? null);
    open();
  };

  const handleDeletePrompt = (device: Device) => {
    setDeviceToDelete(device);
    openDelete();
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          Devices
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => handleOpenEdit()}>
          Add Device
        </Button>
      </Group>

      <Table.ScrollContainer minWidth={550}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Serial Number</Table.Th>
              <Table.Th>Plant</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Threshold</Table.Th>
              <Table.Th>Interval (s)</Table.Th>
              <Table.Th w={100}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={80} /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={120} /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={60} /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={60} /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={60} /></Table.Td>
                </Table.Tr>
              ))
            ) : devices.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center">
                  No devices found
                </Table.Td>
              </Table.Tr>
            ) : (
              devices.map((device) => (
                <Table.Tr key={device.id}>
                  <Table.Td fw={500}>{device.serialNumber}</Table.Td>
                  <Table.Td>{device.plantName ?? <Text size="sm" c="dimmed">Unassigned</Text>}</Table.Td>
                  <Table.Td style={{ textTransform: "capitalize" }}>{device.type}</Table.Td>
                  <Table.Td>
                    {device.humidityConfig
                      ? `${device.humidityConfig.minHumidityThreshold}%`
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    {device.humidityConfig
                      ? device.humidityConfig.sleepDurationSeconds
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon variant="subtle" color="blue" aria-label="Edit device" onClick={() => handleOpenEdit(device)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" aria-label="Delete device" onClick={() => handleDeletePrompt(device)}>
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

      <DeviceFormModal
        opened={opened}
        onClose={close}
        editingDevice={editingDevice}
        plantOptions={plantOptions}
        onSaved={onMutated}
      />

      <DeviceDeleteModal
        opened={deleteOpened}
        onClose={closeDelete}
        device={deviceToDelete}
        onDeleted={onMutated}
      />
    </Stack>
  );
}
