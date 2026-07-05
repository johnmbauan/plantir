import { Divider, Modal, Stack, Text } from "@mantine/core";
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
  onOpenCalibration,
}: DeviceFormModalProps) {
  const {
    form,
    setForm,
    intervalPreset,
    saving,
    createdDevice,
    isEditing,
    validation,
    isValid,
    setHumidityField,
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
    onOpenCalibration,
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        createdDevice ? (
          "Device created"
        ) : isEditing ? (
          <Stack gap={2}>
            <Text fw={600}>Edit device</Text>
            <Text size="sm" c="dimmed" ff="monospace">
              {editingDevice!.serialNumber}
            </Text>
          </Stack>
        ) : (
          "Add device manually"
        )
      }
      size="md"
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
              onPlantChange={(plantId) => setForm((prev) => ({ ...prev, plantId }))}
            />

            <Divider />

            <WateringAlertsSection
              threshold={form.humidityConfig.minHumidityThreshold}
              validation={validation}
              onThresholdChange={(value) => setHumidityField("minHumidityThreshold", value)}
            />

            <Divider />

            <ReportingSection
              intervalPreset={intervalPreset}
              intervalSeconds={form.humidityConfig.sleepDurationSeconds}
              validation={validation}
              onPresetChange={handleIntervalPresetChange}
              onCustomIntervalChange={handleCustomIntervalChange}
            />

            {isEditing && editingDevice && (
              <>
                <Divider />
                <CalibrationSection
                  calibration={form.humidityConfig}
                  editingDevice={editingDevice}
                  onRecalibrate={handleOpenCalibration}
                />
              </>
            )}

            <FormFooter
              isValid={isValid}
              saving={saving}
              onCancel={handleClose}
              onSave={handleSave}
            />
          </>
        )}
      </Stack>
    </Modal>
  );
}
