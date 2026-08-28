import { Button, FileButton, Group, Image, SegmentedControl, Stack, Text } from "@mantine/core";
import type { MutableRefObject } from "react";
import { useTranslation } from "react-i18next";

interface PhotoSectionProps {
  previewSrc: string | null;
  useSpeciesImage: boolean;
  speciesImageAvailable: boolean;
  imageFile: File | null;
  resetFileRef: MutableRefObject<(() => void) | null>;
  saving: boolean;
  onPhotoSourceChange: (source: "species" | "custom") => void;
  onFileChange: (file: File | null) => void;
}

export function PhotoSection({
  previewSrc,
  useSpeciesImage,
  speciesImageAvailable,
  imageFile,
  resetFileRef,
  saving,
  onPhotoSourceChange,
  onFileChange,
}: PhotoSectionProps) {
  const { t } = useTranslation();
  const selectedPhotoSource = useSpeciesImage ? "species" : "custom";

  return (
    <Stack gap="sm">
      <SegmentedControl
        value={selectedPhotoSource}
        onChange={(value) => onPhotoSourceChange(value as "species" | "custom")}
        data={[
          { label: t("species.useSpeciesPhoto"), value: "species", disabled: !speciesImageAvailable },
          { label: t("species.useCustomPhoto"), value: "custom" },
        ]}
        disabled={saving}
        fullWidth
      />
      {previewSrc && (
        <Image
          src={previewSrc}
          alt={t("species.plantPreviewAlt")}
          radius="md"
          h={160}
          w={160}
          fit="cover"
          fallbackSrc="https://placehold.co/160x160?text=No+image"
        />
      )}
      <Group gap="sm" align="center">
        <FileButton resetRef={resetFileRef} onChange={onFileChange} accept="image/*" inputProps={{ "aria-label": t("species.photoFileAria") }}>
          {(props) => (
            <Button variant="default" disabled={saving} {...props}>
              {imageFile || (!useSpeciesImage && previewSrc)
                ? t("species.replaceCustomPhoto")
                : t("species.uploadCustomPhoto")}
            </Button>
          )}
        </FileButton>
        {imageFile && (
          <Text size="sm" c="dimmed" truncate>
            {imageFile.name}
          </Text>
        )}
        {useSpeciesImage && speciesImageAvailable && (
          <Text size="sm" c="dimmed">
            {t("species.usingSpeciesPhoto")}
          </Text>
        )}
      </Group>
    </Stack>
  );
}
