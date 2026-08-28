import { useEffect, useState } from "react";
import { Button, Checkbox, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          title: t("admin.firmware.assignModal.loadFailed"),
          message: err.message,
        });
      })
      .finally(() => setLoading(false));
  }, [opened, release, t]);

  async function handleAssign() {
    if (!release || selectedIds.length === 0) return;
    setSaving(true);
    try {
      await assignFirmwareOverride(selectedIds, release.id);
      notifications.show({
        color: "green",
        title: t("admin.firmware.assignModal.assignedTitle"),
        message: t("admin.firmware.assignModal.assignedMessage", {
          version: release.version,
          semver: release.semver,
          count: selectedIds.length,
        }),
      });
      onAssigned();
      onClose();
    } catch (err) {
      notifications.show({
        color: "red",
        title: t("admin.firmware.assignModal.failedTitle"),
        message: err instanceof Error ? err.message : t("admin.firmware.unknownError"),
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
          ? t("admin.firmware.assignModal.title", {
              version: release.version,
              semver: release.semver,
              board: release.board,
            })
          : t("admin.firmware.assignModal.titleFallback")
      }
      size="md"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t("admin.firmware.assignModal.description")}
        </Text>
        {loading ? (
          <Text size="sm" c="dimmed">{t("admin.firmware.assignModal.loading")}</Text>
        ) : devices.length === 0 ? (
          <Text size="sm" c="dimmed">{t("admin.firmware.assignModal.empty")}</Text>
        ) : (
          <Stack gap="xs" mah={320} style={{ overflowY: "auto" }}>
            {devices.map((device) => (
              <Checkbox
                key={device.id}
                label={
                  <Text size="sm" ff="monospace">
                    {device.serialNumber}
                    {device.firmwareVersion != null
                      ? t("admin.firmware.assignModal.reported", { version: device.firmwareVersion })
                      : ""}
                    {device.firmwareOverrideReleaseId != null
                      ? t("admin.firmware.assignModal.hasOverride")
                      : ""}
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
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => void handleAssign()}
            loading={saving}
            disabled={selectedIds.length === 0}
          >
            {t("admin.firmware.assignModal.assignTo", { count: selectedIds.length })}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
