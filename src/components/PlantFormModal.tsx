import { useEffect, useState } from "react";
import { Modal, Stack, TextInput, Image, Button, Group } from "@mantine/core";
import type { EnrichedPlant } from "@/types";
import { createPlant, updatePlant } from "@/services/plantService";
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
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!opened) return;
    if (editingPlant) {
      setName(editingPlant.name);
      setImageUrl(editingPlant.image_url ?? "");
    } else {
      setName("");
      setImageUrl("");
    }
  }, [opened, editingPlant]);

  const handleSave = async () => {
    try {
      if (editingPlant) {
        await updatePlant(editingPlant.id, name, imageUrl || null);
      } else {
        await createPlant(name, imageUrl || null);
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
        <TextInput
          label="Image URL"
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        {imageUrl && (
          <Image
            src={imageUrl}
            alt="Plant preview"
            radius="md"
            h={120}
            fit="contain"
            fallbackSrc="https://placehold.co/120x120?text=No+image"
          />
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
