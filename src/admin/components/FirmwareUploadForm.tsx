import { useEffect, useMemo, useState } from "react";
import { Button, FileInput, Group, NumberInput, Select, Stack, TextInput, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  uploadFirmwareRelease,
  type FirmwareBoard,
  type FirmwareRelease,
} from "@/admin/adminService";
import { isValidSemver } from "@/admin/semver";

interface FirmwareUploadFormProps {
  releases: FirmwareRelease[];
  onUploaded: () => void;
}

const BOARD_OPTIONS = [
  { value: "esp32c5", label: "ESP32-C5" },
  { value: "esp32c6", label: "ESP32-C6" },
];

function latestReleaseForBoard(
  releases: FirmwareRelease[],
  board: FirmwareBoard | null,
): FirmwareRelease | null {
  if (!board) return null;
  let latest: FirmwareRelease | null = null;
  for (const release of releases) {
    if (release.board !== board) continue;
    if (!latest || release.version > latest.version) latest = release;
  }
  return latest;
}

export function FirmwareUploadForm({ releases, onUploaded }: FirmwareUploadFormProps) {
  const { t } = useTranslation();
  const [board, setBoard] = useState<FirmwareBoard | null>("esp32c6");
  const [version, setVersion] = useState<number | string>(1);
  const [semver, setSemver] = useState("1.0.0");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const currentRelease = useMemo(
    () => latestReleaseForBoard(releases, board),
    [releases, board],
  );
  const nextVersion = (currentRelease?.version ?? 0) + 1;

  useEffect(() => {
    setVersion(nextVersion);
  }, [nextVersion]);

  async function handleSubmit() {
    if (!board || !file || typeof version !== "number" || version < 1) {
      notifications.show({
        color: "yellow",
        title: t("admin.firmware.upload.missingFieldsTitle"),
        message: t("admin.firmware.upload.missingFieldsMessage"),
      });
      return;
    }
    if (!isValidSemver(semver)) {
      notifications.show({
        color: "yellow",
        title: t("admin.firmware.upload.invalidSemverTitle"),
        message: t("admin.firmware.upload.invalidSemverMessage"),
      });
      return;
    }

    setSaving(true);
    try {
      await uploadFirmwareRelease(board, version, semver, file, label);
      notifications.show({
        color: "green",
        title: t("admin.firmware.upload.stagedTitle"),
        message: t("admin.firmware.upload.stagedMessage", {
          board,
          version,
          semver: semver.trim(),
        }),
      });
      setFile(null);
      setLabel("");
      onUploaded();
    } catch (err) {
      notifications.show({
        color: "red",
        title: t("admin.firmware.upload.failedTitle"),
        message: err instanceof Error ? err.message : t("admin.firmware.unknownError"),
      });
    } finally {
      setSaving(false);
    }
  }

  const boardLabel = board ?? t("admin.firmware.upload.thisBoard");
  const currentOtaDescription = currentRelease
    ? t("admin.firmware.upload.currentVersion", { board: boardLabel, version: currentRelease.version })
    : t("admin.firmware.upload.noReleases", { board: boardLabel });
  const currentSemverDescription = currentRelease
    ? t("admin.firmware.upload.currentVersion", { board: boardLabel, version: currentRelease.semver })
    : t("admin.firmware.upload.noReleases", { board: boardLabel });

  return (
    <Stack gap="sm">
      <Group grow align="flex-start">
        <Select
          label={t("admin.firmware.colBoard")}
          description={"\u00a0"}
          inputWrapperOrder={["label", "description", "input", "error"]}
          data={BOARD_OPTIONS}
          value={board}
          onChange={(value) => setBoard(value as FirmwareBoard | null)}
          allowDeselect={false}
        />
        <NumberInput
          label={t("admin.firmware.upload.nextOta")}
          description={currentOtaDescription}
          inputWrapperOrder={["label", "description", "input", "error"]}
          min={1}
          step={1}
          value={version}
          onChange={setVersion}
        />
        <TextInput
          label={
            <Group gap={4} align="center" wrap="nowrap" component="span">
              {t("admin.firmware.colSemver")}
              <Tooltip
                label={t("admin.firmware.upload.semverTooltip")}
                withArrow
                maw={260}
                multiline
              >
                <span style={{ display: "inline-flex", cursor: "help" }}>
                  <IconInfoCircle size={14} aria-label={t("admin.firmware.upload.semverAria")} />
                </span>
              </Tooltip>
            </Group>
          }
          description={currentSemverDescription}
          inputWrapperOrder={["label", "description", "input", "error"]}
          placeholder="1.2.0"
          value={semver}
          onChange={(event) => setSemver(event.currentTarget.value)}
        />
      </Group>
      <Group grow align="flex-end">
        <TextInput
          label={t("admin.firmware.upload.description")}
          placeholder="pilot-battery-fix"
          value={label}
          onChange={(event) => setLabel(event.currentTarget.value)}
        />
        <FileInput
          label={t("admin.firmware.upload.binary")}
          placeholder={t("admin.firmware.upload.binaryPlaceholder")}
          accept=".bin,application/octet-stream"
          value={file}
          onChange={setFile}
          fileInputProps={{ "aria-label": t("admin.firmware.upload.binaryAria") }}
        />
      </Group>
      <Group justify="flex-end">
        <Button onClick={() => void handleSubmit()} loading={saving}>
          {t("admin.firmware.upload.submit")}
        </Button>
      </Group>
    </Stack>
  );
}
