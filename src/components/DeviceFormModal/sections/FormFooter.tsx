import { FormModalFooter } from "@/components/shared/FormModalFooter";

interface Props {
  isValid: boolean;
  isDirty?: boolean;
  saving: boolean;
  submitLabel?: string;
  helperText?: string;
  onCancel: () => void;
  onSave: () => void;
}

export default function FormFooter({
  isValid,
  isDirty = true,
  saving,
  submitLabel = "Save",
  helperText,
  onCancel,
  onSave,
}: Props) {
  return (
    <FormModalFooter
      helperText={helperText}
      submitLabel={submitLabel}
      canSubmit={isValid && isDirty}
      saving={saving}
      onCancel={onCancel}
      onSubmit={onSave}
    />
  );
}
