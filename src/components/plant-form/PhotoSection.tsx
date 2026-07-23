import { Button, FileButton, Group, Image, SegmentedControl, Stack, Text } from "@mantine/core";
import type { MutableRefObject } from "react";

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
  const selectedPhotoSource = useSpeciesImage ? "species" : "custom";

  return (
    <Stack gap="sm">
      <SegmentedControl
        value={selectedPhotoSource}
        onChange={(value) => onPhotoSourceChange(value as "species" | "custom")}
        data={[
          { label: "Use species photo", value: "species", disabled: !speciesImageAvailable },
          { label: "Use custom photo", value: "custom" },
        ]}
        disabled={saving}
        fullWidth
      />
      {previewSrc && (
        <Image
          src={previewSrc}
          alt="Plant preview"
          radius="md"
          h={160}
          w={160}
          fit="cover"
          fallbackSrc="https://placehold.co/160x160?text=No+image"
        />
      )}
      <Group gap="sm" align="center">
        <FileButton resetRef={resetFileRef} onChange={onFileChange} accept="image/*" inputProps={{ "aria-label": "Plant photo file" }}>
          {(props) => (
            <Button variant="default" disabled={saving} {...props}>
              {imageFile || (!useSpeciesImage && previewSrc) ? "Replace custom photo" : "Upload custom photo"}
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
            Using species photo
          </Text>
        )}
      </Group>
    </Stack>
  );
}
