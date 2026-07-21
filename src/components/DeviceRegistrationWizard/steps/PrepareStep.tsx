import { Stack, Text, Alert } from "@mantine/core";
import { IconDeviceDesktop } from "@tabler/icons-react";
import type { PlantOption } from "@/components/DeviceFormModal/types";
import PlantAssignmentSelect from "@/components/DeviceFormModal/PlantAssignmentSelect";

interface Props {
  plantOptions: PlantOption[];
  plantId: string | null;
  onPlantChange: (value: string | null) => void;
}

export default function PrepareStep({ plantOptions, plantId, onPlantChange }: Props) {
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Prepare</Text>
      <Alert
        icon={<IconDeviceDesktop size={16} />}
        color="blue"
        variant="light"
      >
        For the best experience, we recommend completing this setup from a PC or laptop.
      </Alert>
      <Text size="sm">
        This wizard will guide you through registering a Plantir humidity sensor and linking it to your account.
      </Text>
      <PlantAssignmentSelect
        label="Assign to plant (optional)"
        placeholder="You can assign a plant now or later"
        plantOptions={plantOptions}
        value={plantId}
        onChange={onPlantChange}
        clearable
      />
    </Stack>
  );
}
