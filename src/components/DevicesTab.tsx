import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Group,
  ActionIcon,
  Stack,
  Text,
  Skeleton,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconTrash, IconCpu, IconAdjustments } from "@tabler/icons-react";
import { fetchDevices } from "@/services/deviceService";
import { notifications } from "@mantine/notifications";
import { fetchPlants } from "@/services/plantService";
import type { Device, EnrichedPlant } from "@/types";
import { buildPlantAssignmentOptions } from "@/components/DeviceFormModal/plantOptions";
import { getErrorMessage } from "@/utils/error";
import { formatInterval } from "@/utils/time";
import DeviceFormModal from "@/components/DeviceFormModal";
import DeviceDeleteModal from "@/components/DeviceDeleteModal";
import DeviceRegistrationWizard from "@/components/DeviceRegistrationWizard";
import DeviceCalibrationWizard from "@/components/DeviceCalibrationWizard";

export default function DevicesTab({ reloadKey, onMutated }: { reloadKey: number; onMutated: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [plants, setPlants] = useState<EnrichedPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [wizardOpened, { open: openWizard, close: closeWizard }] = useDisclosure(false);

  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const [calibratingDevice, setCalibratingDevice] = useState<Device | null>(null);
  const [calibrationOpened, { open: openCalibration, close: closeCalibration }] = useDisclosure(false);

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

  const handleOpenEdit = (device?: Device) => {
    setEditingDevice(device ?? null);
    open();
  };

  useEffect(() => {

    void loadData();
  }, [reloadKey]);

  useEffect(() => {
    const editDeviceId = searchParams.get("deviceId");
    if (!editDeviceId || loading || devices.length === 0) return;
    const device = devices.find((d) => d.id === Number(editDeviceId));
    if (device) {
      // Open edit modal from URL deep-link once data is ready.

      handleOpenEdit(device);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("deviceId");
        return next;
      }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, devices]);

  useEffect(() => {
    if (searchParams.get("register") !== "1" || loading) return;
    openWizard();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("register");
      return next;
    }, { replace: true });
  }, [loading, searchParams, openWizard, setSearchParams]);

  const registrationPlantOptions = useMemo(
    () => buildPlantAssignmentOptions(plants),
    [plants],
  );

  const deviceFormPlantOptions = useMemo(
    () => buildPlantAssignmentOptions(plants, editingDevice?.id ?? null),
    [plants, editingDevice?.id],
  );

  const handleDeletePrompt = (device: Device) => {
    setDeviceToDelete(device);
    openDelete();
  };

  const handleOpenCalibration = (device: Device) => {
    setCalibratingDevice(device);
    openCalibration();
  };

  const visible = devices.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.serialNumber.toLowerCase().includes(q) ||
      (d.plantName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>
          Devices
        </Text>
        <Group gap="xs">
          <Button variant="subtle" onClick={() => handleOpenEdit()}>
            Add manually
          </Button>
          <Button leftSection={<IconCpu size={16} />} onClick={openWizard}>
            Register new device
          </Button>
        </Group>
      </Group>

      <TextInput
        placeholder="Search by serial number or plant…"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ maxWidth: 320, width: "100%" }}
      />

      <Table.ScrollContainer minWidth={550}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Serial Number</Table.Th>
              <Table.Th>Plant</Table.Th>
              <Table.Th className="col-hide-mobile">Type</Table.Th>
              <Table.Th>Threshold</Table.Th>
              <Table.Th className="col-hide-mobile">Interval</Table.Th>
              <Table.Th w={100}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td><Skeleton height={16} radius="sm" /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={80} /></Table.Td>
                  <Table.Td className="col-hide-mobile"><Skeleton height={16} radius="sm" width={120} /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={60} /></Table.Td>
                  <Table.Td className="col-hide-mobile"><Skeleton height={16} radius="sm" width={60} /></Table.Td>
                  <Table.Td><Skeleton height={16} radius="sm" width={60} /></Table.Td>
                </Table.Tr>
              ))
            ) : visible.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Stack align="center" gap="xs" py="xl">
                    {devices.length === 0 ? (
                      <>
                        <Text fw={500}>No devices yet</Text>
                        <Text size="sm" c="dimmed" ta="center" maw={360}>
                          Register a Plantir sensor with the guided setup wizard, or add a device manually if you already have its serial number.
                        </Text>
                        <Button
                          size="sm"
                          mt="xs"
                          leftSection={<IconCpu size={14} />}
                          onClick={openWizard}
                        >
                          Register your first device
                        </Button>
                      </>
                    ) : (
                      <Text size="sm" c="dimmed">No devices match your search.</Text>
                    )}
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              visible.map((device) => (
                <Table.Tr key={device.id}>
                  <Table.Td fw={500}>{device.serialNumber}</Table.Td>
                  <Table.Td>{device.plantName ?? <Text size="sm" c="dimmed">Unassigned</Text>}</Table.Td>
                  <Table.Td className="col-hide-mobile" style={{ textTransform: "capitalize" }}>{device.type}</Table.Td>
                  <Table.Td>
                    {device.humidityConfig
                      ? `${device.humidityConfig.minHumidityThreshold}%`
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td className="col-hide-mobile">
                    {device.humidityConfig
                      ? formatInterval(device.humidityConfig.sleepDurationSeconds)
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      {device.type === "humidity" && (
                        <Tooltip label="Calibrate sensor" withArrow>
                          <ActionIcon variant="subtle" color="green" aria-label="Calibrate sensor" onClick={() => handleOpenCalibration(device)}>
                            <IconAdjustments size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Edit device" withArrow>
                        <ActionIcon variant="subtle" color="blue" aria-label="Edit device" onClick={() => handleOpenEdit(device)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete device" withArrow>
                        <ActionIcon variant="subtle" color="red" aria-label="Delete device" onClick={() => handleDeletePrompt(device)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <DeviceRegistrationWizard
        opened={wizardOpened}
        onClose={closeWizard}
        plantOptions={registrationPlantOptions}
        onRegistered={onMutated}
      />

      <DeviceFormModal
        opened={opened}
        onClose={close}
        editingDevice={editingDevice}
        plantOptions={deviceFormPlantOptions}
        onSaved={onMutated}
        onOpenCalibration={handleOpenCalibration}
      />

      <DeviceDeleteModal
        opened={deleteOpened}
        onClose={closeDelete}
        device={deviceToDelete}
        onDeleted={onMutated}
      />

      <DeviceCalibrationWizard
        opened={calibrationOpened}
        onClose={() => {
          closeCalibration();
          setCalibratingDevice(null);
        }}
        deviceId={calibratingDevice?.id ?? null}
        onCalibrated={onMutated}
      />
    </Stack>
  );
}
