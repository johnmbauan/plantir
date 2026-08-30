import { Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useDeviceForm } from "@/components/DeviceFormModal/hooks/useDeviceForm";
import type { DeviceFormModalProps } from "@/components/DeviceFormModal/types";
import AddManualIntro from "@/components/DeviceFormModal/sections/AddManualIntro";
import AssignmentSection from "@/components/DeviceFormModal/sections/AssignmentSection";
import CalibrationSection from "@/components/DeviceFormModal/sections/CalibrationSection";
import CreatedDeviceSuccess from "@/components/DeviceFormModal/sections/CreatedDeviceSuccess";
import FormFooter from "@/components/DeviceFormModal/sections/FormFooter";
import ReportingSection from "@/components/DeviceFormModal/sections/ReportingSection";
import WateringAlertsSection from "@/components/DeviceFormModal/sections/WateringAlertsSection";

export default function DeviceFormModal({
  opened,
  onClose,
  editingDevice,
  plantOptions,
  onSaved,
  onFinished,
  onOpenCalibration,
}: DeviceFormModalProps) {
  const { t } = useTranslation();
  const {
    form,
    setForm,
    intervalPreset,
    saving,
    createdDevice,
    isEditing,
    recommendedThreshold,
    validation,
    isValid,
    isDirty,
    helperText,
    setHumidityField,
    handlePlantChange,
    handleCustomIntervalChange,
    handleIntervalPresetChange,
    handleSave,
    handleOpenCalibration,
    handleCalibrateNow,
    handleClose,
  } = useDeviceForm({
    opened,
    editingDevice,
    plantOptions,
    onClose,
    onSaved,
    onFinished,
    onOpenCalibration,
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        createdDevice ? (
          t("deviceForm.createdTitle")
        ) : isEditing ? (
          <Stack gap={2}>
            <Text fw={600}>{t("deviceForm.editTitle")}</Text>
            <Text size="sm" c="dimmed" ff="monospace">
              {editingDevice!.serialNumber}
            </Text>
          </Stack>
        ) : (
          t("deviceForm.addTitle")
        )
      }
      size="lg"
      styles={{ body: { paddingBottom: 0 } }}
    >
      <Stack gap="md">
        {!isEditing && !createdDevice && <AddManualIntro />}

        {createdDevice && (
          <CreatedDeviceSuccess
            showCalibrate={!!onOpenCalibration}
            onCalibrate={handleCalibrateNow}
            onDone={handleClose}
          />
        )}

        {!createdDevice && (
          <>
            <AssignmentSection
              isEditing={isEditing}
              form={form}
              plantOptions={plantOptions}
              validation={validation}
              onSerialChange={(serialNumber) => setForm((prev) => ({ ...prev, serialNumber }))}
              onPlantChange={handlePlantChange}
            />

            <WateringAlertsSection
              threshold={form.humidityConfig.minHumidityThreshold}
              recommendedThreshold={recommendedThreshold}
              validation={validation}
              onThresholdChange={(value) => setHumidityField("minHumidityThreshold", value)}
            />

            <ReportingSection
              intervalPreset={intervalPreset}
              intervalSeconds={form.humidityConfig.sleepDurationSeconds}
              validation={validation}
              onPresetChange={handleIntervalPresetChange}
              onCustomIntervalChange={handleCustomIntervalChange}
            />

            {isEditing && editingDevice && (
              <CalibrationSection
                calibration={form.humidityConfig}
                editingDevice={editingDevice}
                onRecalibrate={handleOpenCalibration}
              />
            )}

            <FormFooter
              isValid={isValid}
              isDirty={isDirty}
              saving={saving}
              submitLabel={isEditing ? t("deviceForm.saveSubmit") : t("deviceForm.addSubmit")}
              helperText={helperText}
              onCancel={handleClose}
              onSave={handleSave}
            />
          </>
        )}
      </Stack>
    </Modal>
  );
}
