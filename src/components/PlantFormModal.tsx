import { useEffect, useRef, useState } from "react";
import { Modal, Stack, TextInput, Image, Button, Group, FileButton, Text } from "@mantine/core";
import type { EnrichedPlant } from "@/types";
import { createPlant, deletePlantImage, updatePlant, uploadPlantImage } from "@/services/plantService";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";

interface Props {
  opened: boolean;
  onClose: () => void;
  editingPlant: EnrichedPlant | null;
  onSaved: () => void;
}

export default function PlantFormModal({ opened, onClose, editingPlant, onSaved }: Props) {
  const [name, setName] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const resetFileRef = useRef<() => void>(null);

  useEffect(() => {
    if (!opened) return;
    if (editingPlant) {
      setName(editingPlant.name);
      setExistingImageUrl(editingPlant.image_url);
    } else {
      setName("");
      setExistingImageUrl(null);
    }
    setImageFile(null);
    resetFileRef.current?.();
  }, [opened, editingPlant]);

  const previewSrc = imageFile ? URL.createObjectURL(imageFile) : existingImageUrl;

  const handleSave = async () => {
    setSaving(true);
    try {
      let resolvedUrl = existingImageUrl;

      if (imageFile) {
        // Delete the old stored image before uploading the new one
        await deletePlantImage(existingImageUrl);
        resolvedUrl = await uploadPlantImage(imageFile);
      }

      if (editingPlant) {
        await updatePlant(editingPlant.id, name, resolvedUrl);
      } else {
        await createPlant(name, resolvedUrl);
      }

      notifications.show({
        color: "green",
        title: "Saved",
        message: `Plant ${editingPlant ? "updated" : "created"} successfully`,
      });
      onClose();
      onSaved();
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={editingPlant ? "Edit Plant" : "Add Plant"}>
      <Stack gap="sm">
        <TextInput
          label="Plant Name"
          placeholder="e.g. Ficus"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          <FileButton resetRef={resetFileRef} onChange={setImageFile} accept="image/*">
            {(props) => (
              <Button variant="default" {...props}>
                {previewSrc ? "Change photo" : "Upload photo"}
              </Button>
            )}
          </FileButton>
          {imageFile && (
            <Text size="sm" c="dimmed" truncate>
              {imageFile.name}
            </Text>
          )}
        </Group>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name} loading={saving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
