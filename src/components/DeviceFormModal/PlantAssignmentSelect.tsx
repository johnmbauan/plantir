import { Select, type SelectProps } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { PlantOption } from "@/components/DeviceFormModal/types";
import { hasAssignedPlantOptions, toPlantSelectData } from "@/components/DeviceFormModal/plantOptions";
import { renderPlantAssignmentOption } from "@/components/DeviceFormModal/renderPlantAssignmentOption";

type Props = Omit<SelectProps, "data" | "renderOption"> & {
  plantOptions: PlantOption[];
};

export default function PlantAssignmentSelect({
  plantOptions,
  description,
  ...selectProps
}: Props) {
  const { t } = useTranslation();
  const assignedByValue = new Map(plantOptions.map((option) => [option.value, option]));

  return (
    <Select
      {...selectProps}
      data={toPlantSelectData(plantOptions)}
      clearButtonProps={{ "aria-label": t("deviceForm.clearPlantAria") }}
      description={
        description ?? (
          hasAssignedPlantOptions(plantOptions)
            ? t("deviceForm.plantsWithDeviceDisabled")
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
