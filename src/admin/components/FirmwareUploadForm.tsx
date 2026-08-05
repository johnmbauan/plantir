import { useEffect, useMemo, useState } from "react";
import { Button, FileInput, Group, NumberInput, Select, Stack, TextInput, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
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
        title: "Missing fields",
        message: "Board, OTA version (≥ 1), SemVer, and a .bin file are required.",
      });
      return;
    }
    if (!isValidSemver(semver)) {
      notifications.show({
        color: "yellow",
        title: "Invalid SemVer",
        message: "Use MAJOR.MINOR.PATCH (e.g. 1.2.0 or 1.2.0-beta.1).",
      });
      return;
    }

    setSaving(true);
    try {
      await uploadFirmwareRelease(board, version, semver, file, label);
      notifications.show({
        color: "green",
        title: "Release staged",
        message: `${board} OTA v${version} (${semver.trim()}) uploaded. Publish or assign next.`,
      });
      setFile(null);
      setLabel("");
      onUploaded();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Upload failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  const boardLabel = board ?? "this board";
  const currentOtaDescription = currentRelease
    ? `Current version for ${boardLabel}: ${currentRelease.version}`
    : `No releases for ${boardLabel} yet`;
  const currentSemverDescription = currentRelease
    ? `Current version for ${boardLabel}: ${currentRelease.semver}`
    : `No releases for ${boardLabel} yet`;

  return (
    <Stack gap="sm">
      <Group grow align="flex-start">
        <Select
          label="Board"
          description={"\u00a0"}
          inputWrapperOrder={["label", "description", "input", "error"]}
          data={BOARD_OPTIONS}
          value={board}
          onChange={(value) => setBoard(value as FirmwareBoard | null)}
          allowDeselect={false}
        />
        <NumberInput
          label="Next OTA version"
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
              SemVer
              <Tooltip
                label="Human-readable version label shown in Admin (e.g. 1.2.0). Devices use the OTA version, not this."
                withArrow
                maw={260}
                multiline
              >
                <span style={{ display: "inline-flex", cursor: "help" }}>
                  <IconInfoCircle size={14} aria-label="What is SemVer?" />
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
          label="Description (optional)"
          placeholder="pilot-battery-fix"
          value={label}
          onChange={(event) => setLabel(event.currentTarget.value)}
        />
        <FileInput
          label="Firmware binary"
          placeholder="Select .bin exported from Arduino IDE"
          accept=".bin,application/octet-stream"
          value={file}
          onChange={setFile}
          fileInputProps={{ "aria-label": "Firmware binary file" }}
        />
      </Group>
      <Group justify="flex-end">
        <Button onClick={() => void handleSubmit()} loading={saving}>
          Upload release
        </Button>
      </Group>
    </Stack>
  );
}
