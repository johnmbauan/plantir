import { Modal, Text, Button, Group } from "@mantine/core";
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
  const confirmDelete = async () => {
    if (!plant) return;
    try {
      await deletePlant(plant.id);
      notifications.show({ color: "green", title: "Deleted", message: "Plant deleted successfully" });
      onClose();
      onDeleted();
    } catch (err) {
      console.error(err);
      notifications.show({ color: "red", title: "Error", message: getErrorMessage(err) });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Delete plant" size="sm">
      <Text size="sm" mb="lg">
        Are you sure you want to delete <b>{plant?.name}</b>?
        <br />
        Any devices currently assigned to this plant will be unassigned.
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
