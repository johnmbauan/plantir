import { useCallback, useEffect, useMemo, useState } from "react";
import type { Device } from "@/types";
import { createDevice, updateDevice, type DeviceFormValues } from "@/services/deviceService";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";
import { intervalPresetSelectValue } from "@/utils/time";
import type { DeviceFormValidationErrors, PlantOption } from "@/components/DeviceFormModal/types";
import { DEFAULT_HUMIDITY, defaultFormValues, formValuesFromDevice } from "@/components/DeviceFormModal/utils";

interface UseDeviceFormOptions {
  opened: boolean;
  editingDevice: Device | null;
  plantOptions: PlantOption[];
  onClose: () => void;
  onSaved: () => void;
  onOpenCalibration?: (device: Device) => void;
}

export function useDeviceForm({
  opened,
  editingDevice,
  plantOptions,
  onClose,
  onSaved,
  onOpenCalibration,
}: UseDeviceFormOptions) {
  const [form, setForm] = useState<DeviceFormValues>(defaultFormValues());
  const [intervalPreset, setIntervalPreset] = useState(String(DEFAULT_HUMIDITY.sleepDurationSeconds));
  const [saving, setSaving] = useState(false);
  const [createdDevice, setCreatedDevice] = useState<Device | null>(null);
  const [thresholdTouched, setThresholdTouched] = useState(false);

  const isEditing = editingDevice != null;

  useEffect(() => {
    if (!opened) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setCreatedDevice(null);
    setThresholdTouched(false);
    if (editingDevice) {
      const values = formValuesFromDevice(editingDevice);
      setForm(values);
      setIntervalPreset(intervalPresetSelectValue(values.humidityConfig.sleepDurationSeconds));
    } else {
      setForm(defaultFormValues());
      setIntervalPreset(String(DEFAULT_HUMIDITY.sleepDurationSeconds));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [opened, editingDevice]);

  const setHumidityField = (
    field: keyof typeof DEFAULT_HUMIDITY,
    value: string | number,
    options?: { markTouched?: boolean },
  ) => {
    if (typeof value !== "number") return;
    const markTouched = options?.markTouched ?? true;
    if (field === "minHumidityThreshold" && markTouched) {
      setThresholdTouched(true);
    }
    setForm((prev) => ({
      ...prev,
      humidityConfig: { ...prev.humidityConfig, [field]: value },
    }));
  };

  const recommendedThreshold = useMemo(() => {
    if (form.plantId == null) return null;
    const selectedPlant = plantOptions.find((option) => String(option.value) === String(form.plantId));
    return selectedPlant?.recommendedThreshold ?? null;
  }, [form.plantId, plantOptions]);

  const handlePlantChange = (plantId: number | null) => {
    setForm((prev) => ({ ...prev, plantId }));
    if (isEditing || thresholdTouched || plantId == null) return;
    const selectedPlant = plantOptions.find((option) => String(option.value) === String(plantId));
    const suggested = selectedPlant?.recommendedThreshold ?? null;
    if (suggested == null) return;
    setHumidityField("minHumidityThreshold", suggested, { markTouched: false });
  };

  const handleCustomIntervalChange = (value: string | number) => {
    const seconds = value === "" || value == null ? Number.NaN : Number(value);
    setForm((prev) => ({
      ...prev,
      humidityConfig: { ...prev.humidityConfig, sleepDurationSeconds: seconds },
    }));
  };

  const validation = useMemo((): DeviceFormValidationErrors => {
    const errors: DeviceFormValidationErrors = {};
    if (!isEditing && !form.serialNumber.trim()) {
      errors.serial = "Serial number is required";
    }
    const threshold = form.humidityConfig.minHumidityThreshold;
    if (threshold < 0 || threshold > 100) {
      errors.threshold = "Threshold must be between 0 and 100";
    }
    const interval = form.humidityConfig.sleepDurationSeconds;
    if (!Number.isFinite(interval) || interval < 1) {
      errors.interval = "Interval must be at least 1 second";
    }
    return errors;
  }, [form, isEditing]);

  const isValid = Object.keys(validation).length === 0;

  const handleIntervalPresetChange = (value: string | null) => {
    if (!value) return;
    setIntervalPreset(value);
    if (value !== "custom") {
      setHumidityField("sleepDurationSeconds", Number(value));
    }
  };

  const handleOpenCalibration = useCallback(
    (device: Device) => {
      if (!onOpenCalibration) return;
      onClose();
      onOpenCalibration(device);
    },
    [onClose, onOpenCalibration],
  );

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, form);
        notifications.show({
          color: "green",
          title: "Saved",
          message: "Device updated successfully",
        });
        onClose();
        onSaved();
      } else {
        const { id } = await createDevice(form);
        onSaved();
        setCreatedDevice({
          id,
          serialNumber: form.serialNumber,
          plantId: form.plantId,
          plantName: plantOptions.find((p) => p.value === String(form.plantId))?.label ?? null,
          type: form.type,
          humidityConfig: null,
        });
      }
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleCalibrateNow = () => {
    const device = createdDevice ?? editingDevice;
    if (!device) return;
    handleOpenCalibration(device);
  };

  const handleClose = () => {
    setCreatedDevice(null);
    onClose();
  };

  return {
    form,
    setForm,
    intervalPreset,
    saving,
    createdDevice,
    isEditing,
    recommendedThreshold,
    validation,
    isValid,
    setHumidityField,
    handlePlantChange,
    handleCustomIntervalChange,
    handleIntervalPresetChange,
    handleSave,
    handleOpenCalibration,
    handleCalibrateNow,
    handleClose,
  };
}
