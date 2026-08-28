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
import { useTranslation } from "react-i18next";
import { useFirmwareTab } from "@/admin/hooks/useFirmwareTab";
import { relativeTime } from "@/utils/time";

export function FirmwareTab() {
  const { t } = useTranslation();
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
        title: t("admin.firmware.publishedTitle"),
        message: t("admin.firmware.publishedMessage", { board: release.board, version: release.version, semver: release.semver }),
      });
      await refresh();
    } catch (err) {
      notifications.show({
        color: "red",
        title: t("admin.firmware.publishFailedTitle"),
        message: err instanceof Error ? err.message : t("admin.firmware.unknownError"),
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
        title: t("admin.firmware.clearedTitle"),
        message: t("admin.firmware.clearedMessage", { board: release.board, version: release.version, semver: release.semver }),
      });
      await refresh();
    } catch (err) {
      notifications.show({
        color: "red",
        title: t("admin.firmware.clearFailedTitle"),
        message: err instanceof Error ? err.message : t("admin.firmware.unknownError"),
      });
    } finally {
      setBusyReleaseId(null);
    }
  }

  const header = (
    <Group justify="space-between" align="flex-start" wrap="wrap">
      <Stack gap={4}>
        <Title order={4} c="var(--green-700)">{t("admin.firmware.title")}</Title>
        <Text size="sm" c="dimmed">
          {t("admin.firmware.description")}
        </Text>
      </Stack>
      <RefreshButton onClick={() => void refresh()} label={t("admin.firmware.refreshLabel")} />
    </Group>
  );

  return (
    <AdminTabLayout header={header}>
      <Stack gap="xl">
        <FirmwareUploadForm releases={releases} onUploaded={() => void refresh()} />

        <Stack gap="xs">
          <Text fw={600} size="sm">{t("admin.firmware.fleetChannels")}</Text>
          {(["esp32c5", "esp32c6"] as const).map((board) => {
            const channel = channels.find((row) => row.board === board);
            const release = channel?.release;
            return (
              <Group key={board} gap="sm">
                <Badge variant="light">{board}</Badge>
                <Text size="sm">
                  {release
                    ? t("admin.firmware.channelRelease", {
                        version: release.version,
                        semver: release.semver,
                        label: release.label ? ` (${release.label})` : "",
                      })
                    : t("admin.firmware.noPublishedRelease")}
                </Text>
              </Group>
            );
          })}
        </Stack>

        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("admin.firmware.colBoard")}</Table.Th>
                <Table.Th>{t("admin.firmware.colOta")}</Table.Th>
                <Table.Th>{t("admin.firmware.colSemver")}</Table.Th>
                <Table.Th>{t("admin.firmware.colLabel")}</Table.Th>
                <Table.Th>{t("admin.firmware.colCreated")}</Table.Th>
                <Table.Th>{t("admin.firmware.colStatus")}</Table.Th>
                <Table.Th>{t("admin.firmware.colActions")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <TableLoadingRows rowCount={4} columnCount={7} />
              ) : releases.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" c="dimmed" py="xl" size="sm">
                      {t("admin.firmware.noReleasesYet")}
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
                          {release.label || t("common.emDash")}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {relativeTime(release.createdAt, t) ?? t("common.emDash")}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {isFleet ? (
                          <Badge color="green" variant="light" size="sm">{t("admin.firmware.statusFleet")}</Badge>
                        ) : (
                          <Badge color="gray" variant="light" size="sm">{t("admin.firmware.statusStaged")}</Badge>
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
                            {t("admin.firmware.publish")}
                          </Button>
                          <Button
                            size="xs"
                            variant="default"
                            disabled={busy}
                            onClick={() => setAssignRelease(release)}
                          >
                            {t("admin.firmware.assign")}
                          </Button>
                          <Button
                            size="xs"
                            variant="subtle"
                            color="red"
                            loading={busy}
                            onClick={() => void handleClearOverrides(release)}
                          >
                            {t("admin.firmware.clearOverrides")}
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
