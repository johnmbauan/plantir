import { Modal, Text, Button, Group } from "@mantine/core";
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
  const confirmDelete = async () => {
    if (!device) return;
    try {
      await deleteDevice(device.id);
      notifications.show({ color: "green", title: "Deleted", message: "Device deleted successfully" });
      onClose();
      onDeleted();
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Delete Device" size="sm">
      <Text size="sm" mb="lg">
        Are you sure you want to delete device <b>{device?.serialNumber}</b>?
        <br />
        Its sensor configuration and all measurements will also be removed.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button color="red" onClick={confirmDelete}>
          Delete
        </Button>
      </Group>
    </Modal>
  );
}
