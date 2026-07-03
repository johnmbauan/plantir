import { useEffect, useState } from "react";
import {
  Modal,
  Stack,
  TextInput,
  Select,
  Divider,
  NumberInput,
  Button,
  Group,
} from "@mantine/core";
import type { Device, DeviceType } from "@/types";
import { createDevice, updateDevice, type DeviceFormValues } from "@/services/deviceService";
import { DEFAULT_HUMIDITY_CONFIG } from "@/constants/deviceDefaults";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";

const DEVICE_TYPES: { value: DeviceType; label: string }[] = [
  { value: "humidity", label: "Humidity" },
];

const DEFAULT_HUMIDITY: DeviceFormValues["humidityConfig"] = {
  ...DEFAULT_HUMIDITY_CONFIG,
};

function defaultFormValues(): DeviceFormValues {
  return {
    serialNumber: "",
    plantId: null,
    type: "humidity",
    humidityConfig: { ...DEFAULT_HUMIDITY },
  };
}

interface Props {
  opened: boolean;
  onClose: () => void;
  editingDevice: Device | null;
  plantOptions: { value: string; label: string }[];
  onSaved: () => void;
}

export default function DeviceFormModal({ opened, onClose, editingDevice, plantOptions, onSaved }: Props) {
  const [form, setForm] = useState<DeviceFormValues>(defaultFormValues());

  useEffect(() => {
    if (!opened) return;
    if (editingDevice) {
      setForm({
        serialNumber: editingDevice.serialNumber,
        plantId: editingDevice.plantId,
        type: editingDevice.type,
        humidityConfig: editingDevice.humidityConfig
          ? {
              minHumidityThreshold: editingDevice.humidityConfig.minHumidityThreshold,
              airValue: editingDevice.humidityConfig.airValue,
              waterValue: editingDevice.humidityConfig.waterValue,
              sleepDurationSeconds: editingDevice.humidityConfig.sleepDurationSeconds,
            }
          : { ...DEFAULT_HUMIDITY },
      });
    } else {
      setForm(defaultFormValues());
    }
  }, [opened, editingDevice]);

  const setHumidityField = (field: keyof typeof DEFAULT_HUMIDITY, value: string | number) => {
    if (typeof value !== "number") return;
    setForm((prev) => ({
      ...prev,
      humidityConfig: { ...prev.humidityConfig, [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!form.serialNumber) return;
    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, form);
      } else {
        await createDevice(form);
      }
      notifications.show({
        color: "green",
        title: "Saved",
        message: `Device ${editingDevice ? "updated" : "created"} successfully`,
      });
      onClose();
      onSaved();
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={editingDevice ? "Edit Device" : "Add Device"} size="md">
      <Stack gap="sm">
        <TextInput
          label="Serial Number"
          placeholder="e.g. SN-001"
          value={form.serialNumber}
          onChange={(e) => setForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
          required
        />
        <Select
          label="Plant"
          placeholder="Select a plant"
          data={plantOptions}
          value={form.plantId ? String(form.plantId) : null}
          onChange={(val) => setForm((prev) => ({ ...prev, plantId: val ? Number(val) : null }))}
          clearable
        />
        <Select
          label="Type"
          data={DEVICE_TYPES}
          value={form.type}
          onChange={(val) => val && setForm((prev) => ({ ...prev, type: val as DeviceType }))}
          required
        />

        {form.type === "humidity" && (
          <>
            <Divider label="Humidity Sensor Configuration" labelPosition="center" my="xs" />
            <NumberInput
              label="Min Humidity Threshold (%)"
              description="Alert when humidity drops below this value"
              min={0}
              max={100}
              value={form.humidityConfig.minHumidityThreshold}
              onChange={(val) => setHumidityField("minHumidityThreshold", val)}
              required
            />
            <NumberInput
              label="Air Value (dry calibration)"
              description="Raw sensor reading when sensor is in open air"
              min={0}
              value={form.humidityConfig.airValue}
              onChange={(val) => setHumidityField("airValue", val)}
              required
            />
            <NumberInput
              label="Water Value (wet calibration)"
              description="Raw sensor reading when sensor is fully submerged"
              min={0}
              value={form.humidityConfig.waterValue}
              onChange={(val) => setHumidityField("waterValue", val)}
              required
            />
            <NumberInput
              label="Reporting Interval (seconds)"
              description="How often the device wakes up and sends data"
              min={1}
              value={form.humidityConfig.sleepDurationSeconds}
              onChange={(val) => setHumidityField("sleepDurationSeconds", val)}
              required
            />
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!form.serialNumber}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
