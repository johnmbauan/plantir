import { useEffect, useRef, useState } from "react";
import { Modal, Stack, Switch, TextInput } from "@mantine/core";
import type { EnrichedPlant } from "@/types";
import { createPlant, deletePlantImage, updatePlant, uploadPlantImage } from "@/services/plantService";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";
import { SpeciesSection } from "@/components/plant-form/SpeciesSection";
import { PhotoSection } from "@/components/plant-form/PhotoSection";
import { usePlantSpeciesSelection } from "@/components/plant-form/usePlantSpeciesSelection";
import { usePlantPreviewSource } from "@/components/plant-form/usePlantPreviewSource";
import { FormModalFooter } from "@/components/shared/FormModalFooter";
import { ModalSection } from "@/components/shared/ModalSection";

interface Props {
  opened: boolean;
  onClose: () => void;
  editingPlant: EnrichedPlant | null;
  onSaved: () => void;
}

export default function PlantFormModal({ opened, onClose, editingPlant, onSaved }: Props) {
  const [name, setName] = useState("");
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<{
    name: string;
    isOutdoor: boolean;
    selectedSpeciesId: string | null;
    selectedSpeciesDbId: number | null;
    useSpeciesImage: boolean;
    existingImageUrl: string | null;
  } | null>(null);
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
  const isDirty = Boolean(
    imageFile
    || !initialSnapshot
    || initialSnapshot.name !== name.trim()
    || initialSnapshot.isOutdoor !== isOutdoor
    || initialSnapshot.selectedSpeciesId !== selectedSpeciesId
    || initialSnapshot.selectedSpeciesDbId !== (selectedSpecies?.id ?? null)
    || initialSnapshot.useSpeciesImage !== useSpeciesImage
    || initialSnapshot.existingImageUrl !== existingImageUrl,
  );

  useEffect(() => {
    if (!opened) return;

    if (editingPlant) {
      setName(editingPlant.name);
      setIsOutdoor(editingPlant.is_outdoor);
      setExistingImageUrl(editingPlant.image_url);
      initializeSpecies(editingPlant);
    } else {
      setName("");
      setIsOutdoor(false);
      setExistingImageUrl(null);
      initializeSpecies(null);
    }
    setImageFile(null);
    resetFileRef.current?.();
    setInitialSnapshot({
      name: editingPlant?.name.trim() ?? "",
      isOutdoor: editingPlant?.is_outdoor ?? false,
      selectedSpeciesId: editingPlant?.species?.sourceSpeciesId ?? null,
      selectedSpeciesDbId: editingPlant?.species?.id ?? editingPlant?.speciesId ?? null,
      useSpeciesImage: false,
      existingImageUrl: editingPlant?.image_url ?? null,
    });

  }, [opened, editingPlant, initializeSpecies]);

  const requestClose = () => {
    if (saving) return;
    if (!isDirty || window.confirm("Discard unsaved changes?")) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!canSave || !isDirty) return;
    setSaving(true);
    try {
      const trimmedName = name.trim();
      let resolvedUrl = existingImageUrl;

      if (useSpeciesImage && selectedSpecies?.imageUrl) {
        if (existingImageUrl && existingImageUrl !== selectedSpecies.imageUrl) {
          await deletePlantImage(existingImageUrl);
        }
        resolvedUrl = selectedSpecies.imageUrl;
      } else if (imageFile) {
        await deletePlantImage(existingImageUrl);
        resolvedUrl = await uploadPlantImage(imageFile);
      }

      if (editingPlant) {
        await updatePlant(editingPlant.id, trimmedName, resolvedUrl, selectedSpecies?.id ?? null, isOutdoor);
      } else {
        await createPlant(trimmedName, resolvedUrl, selectedSpecies?.id ?? null, isOutdoor);
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
    <Modal
      opened={opened}
      onClose={requestClose}
      title={editingPlant ? "Edit plant" : "Add plant"}
      size="lg"
      styles={{ body: { paddingBottom: 0 } }}
    >
      <Stack gap="md">
        <TextInput
          label="Name"
          description="Give this plant a name you can recognize quickly."
          placeholder="e.g. Ficus"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Switch
          label="Outdoor plant"
          description="Enable for outdoor plants that get rainwater"
          checked={isOutdoor}
          onChange={(e) => setIsOutdoor(e.currentTarget.checked)}
          disabled={saving}
        />

        <ModalSection
          title="Species (optional)"
          description="Adding species helps unlock more accurate care guidance."
        >
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
        </ModalSection>

        <ModalSection
          title="Photo"
          description="Choose either the matched species photo or your own custom image."
        >
          <PhotoSection
            previewSrc={previewSrc}
            useSpeciesImage={useSpeciesImage}
            speciesImageAvailable={speciesImageAvailable}
            imageFile={imageFile}
            resetFileRef={resetFileRef}
            saving={saving}
            onPhotoSourceChange={(source) => {
              if (source === "species" && speciesImageAvailable) {
                setUseSpeciesImage(true);
                setImageFile(null);
                resetFileRef.current?.();
                return;
              }
              setUseSpeciesImage(false);
            }}
            onFileChange={(file) => {
              setUseSpeciesImage(false);
              setImageFile(file);
            }}
          />
        </ModalSection>

        <FormModalFooter
          helperText={!canSave ? "Plant name is required" : undefined}
          submitLabel={editingPlant ? "Save changes" : "Add plant"}
          canSubmit={canSave && isDirty}
          saving={saving}
          onCancel={requestClose}
          onSubmit={handleSave}
        />
      </Stack>
    </Modal>
  );
}
