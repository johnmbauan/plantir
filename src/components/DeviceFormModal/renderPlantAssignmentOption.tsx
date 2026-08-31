import { Badge, Group } from "@mantine/core";

export function renderPlantAssignmentOption(
  label: string,
  hasDevice: boolean,
  assignedBadge: string,
) {
  if (!hasDevice) {
    return label;
  }

  return (
    <Group justify="space-between" wrap="nowrap" gap="xs" w="100%">
      <span>{label}</span>
      <Badge size="xs" variant="light" color="gray" style={{ flexShrink: 0 }}>
        {assignedBadge}
      </Badge>
    </Group>
  );
}
