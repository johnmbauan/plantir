import type { Device } from "@/types";

export interface DeviceFormModalProps {
  opened: boolean;
  onClose: () => void;
  editingDevice: Device | null;
  plantOptions: { value: string; label: string }[];
  onSaved: () => void;
  onOpenCalibration?: (device: Device) => void;
}

export interface DeviceFormValidationErrors {
  serial?: string;
  threshold?: string;
  interval?: string;
}
