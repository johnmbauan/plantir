import { Badge, Group, Select, type SelectProps } from "@mantine/core";
import type { PlantOption } from "@/components/DeviceFormModal/types";
import { hasAssignedPlantOptions, toPlantSelectData } from "@/components/DeviceFormModal/plantOptions";

type Props = Omit<SelectProps, "data" | "renderOption"> & {
  plantOptions: PlantOption[];
};

export function renderPlantAssignmentOption(label: string, hasDevice: boolean) {
  if (!hasDevice) {
    return label;
  }

  return (
    <Group justify="space-between" wrap="nowrap" gap="xs" w="100%">
      <span>{label}</span>
      <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>
        device assigned
      </Badge>
    </Group>
  );
}

export default function PlantAssignmentSelect({
  plantOptions,
  description,
  ...selectProps
}: Props) {
  const assignedByValue = new Map(plantOptions.map((option) => [option.value, option]));

  return (
    <Select
      {...selectProps}
      data={toPlantSelectData(plantOptions)}
      description={
        description ?? (
          hasAssignedPlantOptions(plantOptions)
            ? "Plants that already have a device assigned are disabled."
            : undefined
        )
      }
      renderOption={({ option }) =>
        renderPlantAssignmentOption(
          option.label,
          assignedByValue.get(option.value)?.hasDevice ?? false,
        )
      }
    />
  );
}
