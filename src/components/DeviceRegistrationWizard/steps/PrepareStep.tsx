import { Stack, Text, Select } from "@mantine/core";

interface Props {
  plantOptions: { value: string; label: string }[];
  plantId: string | null;
  onPlantChange: (value: string | null) => void;
}

export default function PrepareStep({ plantOptions, plantId, onPlantChange }: Props) {
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>Prepare</Text>
      <Text size="sm">
        This wizard will guide you through registering a Plantir humidity sensor and linking it to your account.
      </Text>
      <Select
        label="Assign to plant (optional)"
        placeholder="You can assign a plant now or later"
        data={plantOptions}
        value={plantId}
        onChange={onPlantChange}
        clearable
      />
    </Stack>
  );
}
