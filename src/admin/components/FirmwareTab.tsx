import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  clearFirmwareOverridesForRelease,
  publishFirmwareToFleet,
  type FirmwareBoard,
  type FirmwareRelease,
} from "@/admin/adminService";
import { AdminTabLayout } from "@/admin/components/AdminTabLayout";
import { AssignFirmwareModal } from "@/admin/components/AssignFirmwareModal";
import { FirmwareUploadForm } from "@/admin/components/FirmwareUploadForm";
import { RefreshButton } from "@/admin/components/RefreshButton";
import { TableLoadingRows } from "@/components/shared/TableLoadingRows";
import { useFirmwareTab } from "@/admin/hooks/useFirmwareTab";
import { relativeTime } from "@/utils/time";

export function FirmwareTab() {
  const { releases, channels, loading, refresh } = useFirmwareTab();
  const [assignRelease, setAssignRelease] = useState<FirmwareRelease | null>(null);
  const [busyReleaseId, setBusyReleaseId] = useState<number | null>(null);

  const fleetByBoard = useMemo(() => {
    const map = new Map<FirmwareBoard, number>();
    for (const channel of channels) {
      map.set(channel.board, channel.release_id);
    }
    return map;
  }, [channels]);

  async function handlePublish(release: FirmwareRelease) {
    setBusyReleaseId(release.id);
    try {
      await publishFirmwareToFleet(release.board, release.id);
      notifications.show({
        color: "green",
        title: "Published to fleet",
        message: `${release.board} channel now points to OTA v${release.version} (${release.semver}).`,
      });
      await refresh();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Publish failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setBusyReleaseId(null);
    }
  }

  async function handleClearOverrides(release: FirmwareRelease) {
    setBusyReleaseId(release.id);
    try {
      await clearFirmwareOverridesForRelease(release.id);
      notifications.show({
        color: "green",
        title: "Overrides cleared",
        message: `Removed pilot overrides for ${release.board} OTA v${release.version} (${release.semver}).`,
      });
      await refresh();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Clear failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setBusyReleaseId(null);
    }
  }

  const header = (
    <Group justify="space-between" align="flex-start" wrap="wrap">
      <Stack gap={4}>
        <Title order={4} c="var(--green-700)">Firmware releases</Title>
        <Text size="sm" c="dimmed">
          Upload stages a build. Assign to pilot devices, then publish to the fleet channel.
        </Text>
      </Stack>
      <RefreshButton onClick={() => void refresh()} label="Refresh firmware releases" />
    </Group>
  );

  return (
    <AdminTabLayout header={header}>
      <Stack gap="xl">
        <FirmwareUploadForm releases={releases} onUploaded={() => void refresh()} />

        <Stack gap="xs">
          <Text fw={600} size="sm">Fleet channels</Text>
          {(["esp32c5", "esp32c6"] as const).map((board) => {
            const channel = channels.find((row) => row.board === board);
            const release = channel?.release;
            return (
              <Group key={board} gap="sm">
                <Badge variant="light">{board}</Badge>
                <Text size="sm">
                  {release
                    ? `OTA v${release.version} · ${release.semver}${release.label ? ` (${release.label})` : ""}`
                    : "No published release"}
                </Text>
              </Group>
            );
          })}
        </Stack>

        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Board</Table.Th>
                <Table.Th>OTA</Table.Th>
                <Table.Th>SemVer</Table.Th>
                <Table.Th>Label</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <TableLoadingRows rowCount={4} columnCount={7} />
              ) : releases.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" c="dimmed" py="xl" size="sm">
                      No firmware releases yet. Upload a .bin to stage the first build.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                releases.map((release) => {
                  const isFleet = fleetByBoard.get(release.board) === release.id;
                  const busy = busyReleaseId === release.id;
                  return (
                    <Table.Tr key={release.id}>
                      <Table.Td>
                        <Badge variant="outline" size="sm">{release.board}</Badge>
                      </Table.Td>
                      <Table.Td fw={600}>v{release.version}</Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace">{release.semver}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c={release.label ? undefined : "dimmed"}>
                          {release.label || "—"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {relativeTime(release.createdAt) ?? "—"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {isFleet ? (
                          <Badge color="green" variant="light" size="sm">Fleet</Badge>
                        ) : (
                          <Badge color="gray" variant="light" size="sm">Staged</Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="light"
                            loading={busy}
                            disabled={isFleet}
                            onClick={() => void handlePublish(release)}
                          >
                            Publish
                          </Button>
                          <Button
                            size="xs"
                            variant="default"
                            disabled={busy}
                            onClick={() => setAssignRelease(release)}
                          >
                            Assign
                          </Button>
                          <Button
                            size="xs"
                            variant="subtle"
                            color="red"
                            loading={busy}
                            onClick={() => void handleClearOverrides(release)}
                          >
                            Clear overrides
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>

      <AssignFirmwareModal
        release={assignRelease}
        opened={assignRelease !== null}
        onClose={() => setAssignRelease(null)}
        onAssigned={() => void refresh()}
      />
    </AdminTabLayout>
  );
}
