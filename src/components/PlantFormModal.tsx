import { useEffect, useRef, useState } from "react";
import { Divider, Group, Modal, Select, Stack, Switch, Text, TextInput, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { EnrichedPlant, PotDepthClass } from "@/types";
import {
  isPotDepthClass,
} from "@/constants/potDepth";
import { createPlant, deletePlantImage, updatePlant, uploadPlantImage } from "@/services/plantService";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";
import { SpeciesSection } from "@/components/plant-form/SpeciesSection";
import { PhotoSection } from "@/components/plant-form/PhotoSection";
import { usePlantSpeciesSelection } from "@/components/plant-form/usePlantSpeciesSelection";
import { usePlantPreviewSource } from "@/components/plant-form/usePlantPreviewSource";
import { FormModalFooter } from "@/components/shared/FormModalFooter";
interface Props {
  opened: boolean;
  onClose: () => void;
  editingPlant: EnrichedPlant | null;
  onSaved: () => void;
}

export default function PlantFormModal({ opened, onClose, editingPlant, onSaved }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [potDepthClass, setPotDepthClass] = useState<PotDepthClass | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<{
    name: string;
    isOutdoor: boolean;
    potDepthClass: PotDepthClass | null;
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
    || initialSnapshot.potDepthClass !== potDepthClass
    || initialSnapshot.selectedSpeciesId !== selectedSpeciesId
    || initialSnapshot.selectedSpeciesDbId !== (selectedSpecies?.id ?? null)
    || initialSnapshot.useSpeciesImage !== useSpeciesImage
    || initialSnapshot.existingImageUrl !== existingImageUrl,
  );

  const POT_DEPTH_SELECT_OPTIONS: { value: PotDepthClass | ""; label: string }[] = [
    { value: "", label: t("potDepth.notSure") },
    { value: "compact", label: t("potDepth.compact") },
    { value: "small", label: t("potDepth.small") },
    { value: "medium", label: t("potDepth.medium") },
    { value: "large", label: t("potDepth.large") },
    { value: "deep", label: t("potDepth.deep") },
    { value: "in_ground", label: t("potDepth.inGround") },
  ];

  useEffect(() => {
    if (!opened) return;

    if (editingPlant) {
      setName(editingPlant.name);
      setIsOutdoor(editingPlant.is_outdoor);
      setPotDepthClass(editingPlant.potDepthClass);
      setExistingImageUrl(editingPlant.image_url);
      initializeSpecies(editingPlant);
    } else {
      setName("");
      setIsOutdoor(false);
      setPotDepthClass(null);
      setExistingImageUrl(null);
      initializeSpecies(null);
    }
    setImageFile(null);
    resetFileRef.current?.();
    setInitialSnapshot({
      name: editingPlant?.name.trim() ?? "",
      isOutdoor: editingPlant?.is_outdoor ?? false,
      potDepthClass: editingPlant?.potDepthClass ?? null,
      selectedSpeciesId: editingPlant?.species?.sourceSpeciesId ?? null,
      selectedSpeciesDbId: editingPlant?.species?.id ?? editingPlant?.speciesId ?? null,
      useSpeciesImage: false,
      existingImageUrl: editingPlant?.image_url ?? null,
    });

  }, [opened, editingPlant, initializeSpecies]);

  const requestClose = () => {
    if (saving) return;
    if (!isDirty || window.confirm(t("common.discardUnsavedChanges"))) {
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
        await updatePlant(
          editingPlant.id,
          trimmedName,
          resolvedUrl,
          selectedSpecies?.id ?? null,
          isOutdoor,
          potDepthClass,
        );
      } else {
        await createPlant(
          trimmedName,
          resolvedUrl,
          selectedSpecies?.id ?? null,
          isOutdoor,
          potDepthClass,
        );
      }

      notifications.show({
        color: "green",
        title: t("common.saved"),
        message: editingPlant ? t("plantForm.updatedMessage") : t("plantForm.createdMessage"),
      });
      onClose();
      onSaved();
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={requestClose}
      title={editingPlant ? t("plantForm.editTitle") : t("plantForm.addTitle")}
      size="lg"
      styles={{ body: { paddingBottom: 0 } }}
    >
      <Stack gap="md">
        <TextInput
          label={t("plantForm.name")}
          description={t("plantForm.nameDescription")}
          placeholder={t("plantForm.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Switch
          label={t("plantForm.outdoorLabel")}
          description={t("plantForm.outdoorDescription")}
          checked={isOutdoor}
          onChange={(e) => setIsOutdoor(e.currentTarget.checked)}
          disabled={saving}
        />

        <Stack gap={4}>
          <Group gap={6} wrap="nowrap">
            <Text size="sm" fw={500}>
              {t("plantForm.potHeight")}
            </Text>
            <Tooltip
              label={t("potDepth.tooltip")}
              multiline
              w={320}
              withArrow
              events={{ hover: true, focus: true, touch: true }}
            >
              <Text
                component="span"
                c="dimmed"
                style={{ display: "inline-flex", cursor: "help" }}
                aria-label={t("plantForm.potHeightWhyAria")}
              >
                <IconInfoCircle size={16} />
              </Text>
            </Tooltip>
          </Group>
          <Select
            aria-label={t("plantForm.potHeightAria")}
            description={t("plantForm.potHeightDescription")}
            data={POT_DEPTH_SELECT_OPTIONS}
            value={potDepthClass ?? ""}
            onChange={(value) => {
              setPotDepthClass(isPotDepthClass(value) ? value : null);
            }}
            allowDeselect={false}
            disabled={saving}
          />
        </Stack>

        <Divider label={t("plantForm.speciesSectionTitle")} labelPosition="center" mt={10} />
        <Text size="xs" c="dimmed">{t("plantForm.speciesSectionDescription")}</Text>
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

        <Divider label={t("plantForm.photoSectionTitle")} labelPosition="center" mt={10} />
        <Text size="xs" c="dimmed">{t("plantForm.photoSectionDescription")}</Text>
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

        <FormModalFooter
          helperText={!canSave ? t("plantForm.nameRequired") : undefined}
          submitLabel={editingPlant ? t("plantForm.saveSubmit") : t("plantForm.addSubmit")}
          canSubmit={canSave && isDirty}
          saving={saving}
          onCancel={requestClose}
          onSubmit={handleSave}
        />
      </Stack>
    </Modal>
  );
}
