import { Badge, Stack, TextInput, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { DeviceFormValues } from "@/services/deviceService";
import type { DeviceFormValidationErrors } from "@/components/DeviceFormModal/types";
import type { PlantOption } from "@/components/DeviceFormModal/types";
import PlantAssignmentSelect from "@/components/DeviceFormModal/PlantAssignmentSelect";

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
  const { t } = useTranslation();
  return (
    <Stack gap="xs">
      <Title order={6}>{t("deviceForm.assignment")}</Title>
      {!isEditing && (
        <TextInput
          label={t("deviceForm.serialNumber")}
          placeholder={t("deviceForm.serialPlaceholder")}
          value={form.serialNumber}
          onChange={(e) => onSerialChange(e.target.value)}
          error={validation.serial}
          required
        />
      )}
      {isEditing && (
        <>
          <TextInput
            label={t("deviceForm.serialNumber")}
            value={form.serialNumber}
            readOnly
            styles={{ input: { opacity: 0.7, cursor: "default" } }}
          />
          <Badge variant="light" color="green" w="fit-content" style={{ textTransform: "capitalize" }}>
            {t("deviceForm.humiditySensor")}
          </Badge>
        </>
      )}
      <PlantAssignmentSelect
        label={t("deviceForm.plant")}
        placeholder={t("deviceForm.plantPlaceholder")}
        plantOptions={plantOptions}
        value={form.plantId ? String(form.plantId) : null}
        onChange={(val) => onPlantChange(val ? Number(val) : null)}
        clearable
        searchable={plantOptions.length > 8}
      />
    </Stack>
  );
}
