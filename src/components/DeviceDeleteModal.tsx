import { Modal, Text, Button, Group } from "@mantine/core";
import { Trans, useTranslation } from "react-i18next";
import type { Device } from "@/types";
import { deleteDevice } from "@/services/deviceService";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/utils/error";

interface Props {
  opened: boolean;
  onClose: () => void;
  device: Device | null;
  onDeleted: () => void;
}

export default function DeviceDeleteModal({ opened, onClose, device, onDeleted }: Props) {
  const { t } = useTranslation();

  const confirmDelete = async () => {
    if (!device) return;
    try {
      await deleteDevice(device.id);
      notifications.show({
        color: "green",
        title: t("deviceDelete.success.title"),
        message: t("deviceDelete.success.message"),
      });
      onClose();
      onDeleted();
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: t("common.error"), message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("deviceDelete.title")} size="sm">
      <Text size="sm" mb="lg">
        <Trans i18nKey="deviceDelete.confirm" values={{ serialNumber: device?.serialNumber }} components={{ bold: <b /> }} />
        <br />
        {t("deviceDelete.warning")}
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
