import { Badge, Select, Stack, TextInput, Title } from "@mantine/core";
import type { DeviceFormValues } from "@/services/deviceService";
import type { DeviceFormValidationErrors } from "@/components/DeviceFormModal/types";
import type { PlantOption } from "@/components/DeviceFormModal/types";

interface Props {
  isEditing: boolean;
  form: DeviceFormValues;
  plantOptions: PlantOption[];
  validation: DeviceFormValidationErrors;
  onSerialChange: (serialNumber: string) => void;
  onPlantChange: (plantId: number | null) => void;
}

export default function AssignmentSection({
  isEditing,
  form,
  plantOptions,
  validation,
  onSerialChange,
  onPlantChange,
}: Props) {
  return (
    <Stack gap="xs">
      <Title order={6}>Assignment</Title>
      {!isEditing && (
        <TextInput
          label="Serial number"
          placeholder="e.g. SN-001"
          value={form.serialNumber}
          onChange={(e) => onSerialChange(e.target.value)}
          error={validation.serial}
          required
        />
      )}
      {isEditing && (
        <>
          <TextInput
            label="Serial number"
            value={form.serialNumber}
            readOnly
            styles={{ input: { opacity: 0.7, cursor: "default" } }}
          />
          <Badge variant="light" color="green" w="fit-content" style={{ textTransform: "capitalize" }}>
            Humidity sensor
          </Badge>
        </>
      )}
      <Select
        label="Plant"
        placeholder="Select a plant"
        data={plantOptions}
        value={form.plantId ? String(form.plantId) : null}
        onChange={(val) => onPlantChange(val ? Number(val) : null)}
        clearable
        searchable={plantOptions.length > 8}
      />
    </Stack>
  );
}
