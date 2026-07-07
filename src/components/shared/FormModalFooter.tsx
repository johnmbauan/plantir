import { Button, Group, Text } from "@mantine/core";

interface FormModalFooterProps {
  helperText?: string;
  submitLabel: string;
  savingLabel?: string;
  canSubmit: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  sticky?: boolean;
}

export function FormModalFooter({
  helperText,
  submitLabel,
  savingLabel = "Saving...",
  canSubmit,
  saving,
  onCancel,
  onSubmit,
  sticky = true,
}: FormModalFooterProps) {
  return (
    <Group
      justify="space-between"
      mt="md"
      style={
        sticky
          ? {
              position: "sticky",
              bottom: 0,
              zIndex: 2,
              borderTop: "1px solid var(--mantine-color-gray-3)",
              background: "var(--mantine-color-body)",
              paddingTop: 12,
              paddingBottom: 12,
            }
          : undefined
      }
    >
      <Text size="xs" c="dimmed">
        {helperText ?? " "}
      </Text>
      <Group>
        <Button variant="default" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!canSubmit || saving} loading={saving}>
          {saving ? savingLabel : submitLabel}
        </Button>
      </Group>
    </Group>
  );
}
