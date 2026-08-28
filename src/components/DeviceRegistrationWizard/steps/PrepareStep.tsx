import { Stack, Text, Alert } from "@mantine/core";
import { IconDeviceDesktop } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { PlantOption } from "@/components/DeviceFormModal/types";
import PlantAssignmentSelect from "@/components/DeviceFormModal/PlantAssignmentSelect";

interface Props {
  plantOptions: PlantOption[];
  plantId: string | null;
  onPlantChange: (value: string | null) => void;
}

export default function PrepareStep({ plantOptions, plantId, onPlantChange }: Props) {
  const { t } = useTranslation();
  return (
    <Stack gap="sm" mt="md">
      <Text fw={600}>{t("registrationWizard.prepare.title")}</Text>
      <Alert
        icon={<IconDeviceDesktop size={16} />}
        color="blue"
        variant="light"
      >
        {t("registrationWizard.prepare.pcRecommendation")}
      </Alert>
      <Text size="sm">
        {t("registrationWizard.prepare.intro")}
      </Text>
      <PlantAssignmentSelect
        label={t("registrationWizard.prepare.assignPlant")}
        placeholder={t("registrationWizard.prepare.assignPlantPlaceholder")}
        plantOptions={plantOptions}
        value={plantId}
        onChange={onPlantChange}
        clearable
      />
    </Stack>
  );
}
