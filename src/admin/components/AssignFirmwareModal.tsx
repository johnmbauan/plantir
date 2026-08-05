import { useEffect, useState } from "react";
import { Button, Checkbox, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  assignFirmwareOverride,
  fetchAdminDevicesForBoard,
  type FirmwareRelease,
} from "@/admin/adminService";

interface AssignFirmwareModalProps {
  release: FirmwareRelease | null;
  opened: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignFirmwareModal({
  release,
  opened,
  onClose,
  onAssigned,
}: AssignFirmwareModalProps) {
  const [devices, setDevices] = useState<
    Awaited<ReturnType<typeof fetchAdminDevicesForBoard>>
  >([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opened || !release) return;
    setSelectedIds([]);
    setLoading(true);
    void fetchAdminDevicesForBoard(release.board)
      .then(setDevices)
      .catch((err: Error) => {
        notifications.show({
          color: "red",
          title: "Failed to load devices",
          message: err.message,
        });
      })
      .finally(() => setLoading(false));
  }, [opened, release]);

  async function handleAssign() {
    if (!release || selectedIds.length === 0) return;
    setSaving(true);
    try {
      await assignFirmwareOverride(selectedIds, release.id);
      notifications.show({
        color: "green",
        title: "Override assigned",
        message: `Pinned OTA v${release.version} (${release.semver}) on ${selectedIds.length} device(s).`,
      });
      onAssigned();
      onClose();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Assign failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  function toggleDevice(id: number, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((value) => value !== id),
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        release
          ? `Assign OTA v${release.version} · ${release.semver} (${release.board})`
          : "Assign firmware"
      }
      size="md"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Selected devices will OTA to this release on their next wake, even if the fleet
          channel points elsewhere.
        </Text>
        {loading ? (
          <Text size="sm" c="dimmed">Loading devices…</Text>
        ) : devices.length === 0 ? (
          <Text size="sm" c="dimmed">No devices found for this board.</Text>
        ) : (
          <Stack gap="xs" mah={320} style={{ overflowY: "auto" }}>
            {devices.map((device) => (
              <Checkbox
                key={device.id}
                label={
                  <Text size="sm" ff="monospace">
                    {device.serialNumber}
                    {device.firmwareVersion != null ? ` · reported v${device.firmwareVersion}` : ""}
                    {device.firmwareOverrideReleaseId != null ? " · has override" : ""}
                  </Text>
                }
                checked={selectedIds.includes(device.id)}
                onChange={(event) => toggleDevice(device.id, event.currentTarget.checked)}
              />
            ))}
          </Stack>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleAssign()}
            loading={saving}
            disabled={selectedIds.length === 0}
          >
            Assign to {selectedIds.length || ""} device{selectedIds.length === 1 ? "" : "s"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
