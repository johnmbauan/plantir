import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCpu } from "@tabler/icons-react";
import { fetchDevices } from "@/services/deviceService";
import { notifications } from "@mantine/notifications";
import { fetchPlants } from "@/services/plantService";
import type { Device, EnrichedPlant } from "@/types";
import { buildPlantAssignmentOptions } from "@/components/DeviceFormModal/plantOptions";
import { getErrorMessage } from "@/utils/error";
import type { SortDirection } from "@/utils/sort";
import { nextSortState } from "@/utils/sort";
import DeviceFormModal from "@/components/DeviceFormModal";
import DeviceDeleteModal from "@/components/DeviceDeleteModal";
import DeviceRegistrationWizard from "@/components/DeviceRegistrationWizard";
import DeviceCalibrationWizard from "@/components/DeviceCalibrationWizard";
import DeviceTableRow from "@/components/DevicesTab/DeviceTableRow";
import {
  deviceMatchesSearch,
  sortDevicesByColumn,
  type DevicesTabSortKey,
} from "@/components/DevicesTab/utils";
import { plantThumbnailUrl } from "@/utils/plantDisplay";
import PlantFilterSearch from "@/components/PlantFilterSearch";
import { SortableTh } from "@/components/shared/SortableTh";
import { TableLoadingRows } from "@/components/shared/TableLoadingRows";

const COLUMN_COUNT = 4;

const SORTABLE_COLUMNS: { key: DevicesTabSortKey; label: string; className?: string }[] = [
  { key: "serial", label: "Serial Number" },
  { key: "plant", label: "Plant" },
  { key: "interval", label: "Interval", className: "col-hide-mobile" },
];

export default function DevicesTab({ reloadKey, onMutated }: { reloadKey: number; onMutated: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [plants, setPlants] = useState<EnrichedPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<DevicesTabSortKey>("serial");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

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

  const handleSort = (key: string) => {
    const next = nextSortState(sortKey, sortDir, key as DevicesTabSortKey);
    setSortKey(next.sortKey);
    setSortDir(next.sortDir);
  };

  const openPlant = (plantId: number) => {
    setSearchParams(
      { tab: "plants", plantId: String(plantId) },
      { replace: true },
    );
  };

  const plantImageById = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const plant of plants) {
      map.set(plant.id, plantThumbnailUrl(plant));
    }
    return map;
  }, [plants]);

  const visible = useMemo(() => {
    const filtered = devices.filter((d) => deviceMatchesSearch(d, search));
    return sortDevicesByColumn(filtered, sortKey, sortDir);
  }, [devices, search, sortKey, sortDir]);

  return (
    <Stack gap="md">
      <div className="filter-toolbar center-tab-toolbar">
        <PlantFilterSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by serial or plant…"
          searchLabel="Search devices"
        />
        <Group gap="xs">
          <Button variant="subtle" onClick={() => handleOpenEdit()}>
            Add manually
          </Button>
          <Button leftSection={<IconCpu size={16} />} onClick={openWizard}>
            Register new device
          </Button>
        </Group>
      </div>

      <Table.ScrollContainer minWidth={550}>
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
                <DeviceTableRow
                  key={device.id}
                  device={device}
                  plantImageUrl={
                    device.plantId != null ? (plantImageById.get(device.plantId) ?? null) : null
                  }
                  onEdit={handleOpenEdit}
                  onDelete={handleDeletePrompt}
                  onCalibrate={handleOpenCalibration}
                  onOpenPlant={openPlant}
                />
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
