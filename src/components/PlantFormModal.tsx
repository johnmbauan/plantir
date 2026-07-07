import { useEffect, useRef, useState } from "react";
import { Modal, Stack, TextInput, Button, Group, Divider } from "@mantine/core";
import type { EnrichedPlant } from "@/types";
import { createPlant, deletePlantImage, updatePlant, uploadPlantImage } from "@/services/plantService";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";
import { SpeciesSection } from "@/components/plant-form/SpeciesSection";
import { PhotoSection } from "@/components/plant-form/PhotoSection";
import { usePlantSpeciesSelection } from "@/components/plant-form/usePlantSpeciesSelection";
import { usePlantPreviewSource } from "@/components/plant-form/usePlantPreviewSource";

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
  const resetFileRef = useRef<(() => void) | null>(null);

  const {
    speciesQuery,
    speciesResults,
    selectedSpeciesId,
    selectedSpecies,
    useSpeciesImage,
    speciesSearchLoading,
    speciesDetailLoading,
    speciesError,
    setUseSpeciesImage,
    clearSpeciesSelection,
    initializeSpecies,
    handleSpeciesSearchChange,
    handleSpeciesSelect,
  } = usePlantSpeciesSelection({ opened });

  const previewSrc = usePlantPreviewSource({
    existingImageUrl,
    imageFile,
    useSpeciesImage,
    speciesImageUrl: selectedSpecies?.imageUrl,
  });
  const canSave = Boolean(name.trim());
  const speciesImageAvailable = Boolean(selectedSpecies?.imageUrl);

  useEffect(() => {
    if (!opened) return;
    // Form state is reset/hydrated when modal opens or edit target changes.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editingPlant) {
      setName(editingPlant.name);
      setExistingImageUrl(editingPlant.image_url);
      initializeSpecies(editingPlant);
    } else {
      setName("");
      setExistingImageUrl(null);
      initializeSpecies(null);
    }
    setImageFile(null);
    resetFileRef.current?.();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [opened, editingPlant, initializeSpecies]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      let resolvedUrl = existingImageUrl;

      if (useSpeciesImage && selectedSpecies?.imageUrl) {
        if (existingImageUrl && existingImageUrl !== selectedSpecies.imageUrl) {
          await deletePlantImage(existingImageUrl);
        }
        resolvedUrl = selectedSpecies.imageUrl;
      } else if (imageFile) {
        // Delete the old stored image before uploading the new one
        await deletePlantImage(existingImageUrl);
        resolvedUrl = await uploadPlantImage(imageFile);
      }

      if (editingPlant) {
        await updatePlant(editingPlant.id, name, resolvedUrl, selectedSpecies?.id ?? null);
      } else {
        await createPlant(name, resolvedUrl, selectedSpecies?.id ?? null);
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
    <Modal opened={opened} onClose={onClose} title={editingPlant ? "Edit Plant" : "Add Plant"} size="lg">
      <Stack gap="md">
        <Divider label="Plant" labelPosition="left" />
        <TextInput
          label="Plant Name"
          placeholder="e.g. Ficus"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Divider label="Species (optional)" labelPosition="left" />
        <SpeciesSection
          speciesQuery={speciesQuery}
          speciesResults={speciesResults}
          selectedSpeciesId={selectedSpeciesId}
          selectedSpecies={selectedSpecies}
          speciesSearchLoading={speciesSearchLoading}
          speciesDetailLoading={speciesDetailLoading}
          speciesError={speciesError}
          saving={saving}
          onSearchChange={handleSpeciesSearchChange}
          onSelect={handleSpeciesSelect}
          onRejectSpecies={clearSpeciesSelection}
        />

        <Divider label="Photo" labelPosition="left" />
        <PhotoSection
          previewSrc={previewSrc}
          useSpeciesImage={useSpeciesImage}
          speciesImageAvailable={speciesImageAvailable}
          imageFile={imageFile}
          resetFileRef={resetFileRef}
          onToggleUseSpeciesImage={() => {
            setUseSpeciesImage((prev) => !prev);
            if (!useSpeciesImage) {
              setImageFile(null);
              resetFileRef.current?.();
            }
          }}
          onFileChange={(file) => {
            setUseSpeciesImage(false);
            setImageFile(file);
          }}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave} loading={saving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
