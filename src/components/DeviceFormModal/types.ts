import type { Device } from "@/types";

export interface PlantOption {
  value: string;
  label: string;
  recommendedThreshold?: number | null;
  hasDevice?: boolean;
}

export interface DeviceFormModalProps {
  opened: boolean;
  onClose: () => void;
  editingDevice: Device | null;
  plantOptions: PlantOption[];
  onSaved: () => void;
  onOpenCalibration?: (device: Device) => void;
}

export interface DeviceFormValidationErrors {
  serial?: string;
  threshold?: string;
  interval?: string;
}
