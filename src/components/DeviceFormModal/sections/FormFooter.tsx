import { Button, Group } from "@mantine/core";

interface Props {
  isValid: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export default function FormFooter({ isValid, saving, onCancel, onSave }: Props) {
  return (
    <Group justify="flex-end" mt="md">
      <Button variant="default" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={!isValid} loading={saving}>
        Save
      </Button>
    </Group>
  );
}
