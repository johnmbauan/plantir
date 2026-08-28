import { Modal, Text, Button, Group } from "@mantine/core";
import { Trans, useTranslation } from "react-i18next";
import type { EnrichedPlant } from "@/types";
import { deletePlant } from "@/services/plantService";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";

interface Props {
  opened: boolean;
  onClose: () => void;
  plant: EnrichedPlant | null;
  onDeleted: () => void;
}

export default function PlantDeleteModal({ opened, onClose, plant, onDeleted }: Props) {
  const { t } = useTranslation();

  const confirmDelete = async () => {
    if (!plant) return;
    try {
      await deletePlant(plant.id);
      notifications.show({
        color: "green",
        title: t("plantDelete.success.title"),
        message: t("plantDelete.success.message"),
      });
      onClose();
      onDeleted();
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("plantDelete.title")} size="sm">
      <Text size="sm" mb="lg">
        <Trans i18nKey="plantDelete.confirm" values={{ name: plant?.name }} components={{ bold: <b /> }} />
        <br />
        {t("plantDelete.unassignWarning")}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button color="red" onClick={confirmDelete}>
          {t("common.delete")}
        </Button>
      </Group>
    </Modal>
  );
}
