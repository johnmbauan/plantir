import { Button, FileButton, Group, Image, Text } from "@mantine/core";
import type { MutableRefObject } from "react";

interface PhotoSectionProps {
  previewSrc: string | null;
  useSpeciesImage: boolean;
  speciesImageAvailable: boolean;
  imageFile: File | null;
  resetFileRef: MutableRefObject<(() => void) | null>;
  onToggleUseSpeciesImage: () => void;
  onFileChange: (file: File | null) => void;
}

export function PhotoSection({
  previewSrc,
  useSpeciesImage,
  speciesImageAvailable,
  imageFile,
  resetFileRef,
  onToggleUseSpeciesImage,
  onFileChange,
}: PhotoSectionProps) {
  return (
    <>
      {previewSrc && (
        <Image
          src={previewSrc}
          alt="Plant preview"
          radius="md"
          h={120}
          fit="contain"
          fallbackSrc="https://placehold.co/120x120?text=No+image"
        />
      )}
      <Group gap="sm" align="center">
        <Button
          variant={useSpeciesImage ? "filled" : "default"}
          disabled={!speciesImageAvailable}
          onClick={onToggleUseSpeciesImage}
        >
          Use species image
        </Button>
        <FileButton resetRef={resetFileRef} onChange={onFileChange} accept="image/*">
          {(props) => (
            <Button variant="default" {...props}>
              {imageFile || (!useSpeciesImage && previewSrc) ? "Change custom photo" : "Upload custom photo"}
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
            Using species image
          </Text>
        )}
      </Group>
    </>
  );
}
