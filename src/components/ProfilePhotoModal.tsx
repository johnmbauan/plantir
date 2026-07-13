import { Image, Modal } from "@mantine/core";

interface ProfilePhotoModalProps {
  opened: boolean;
  onClose: () => void;
  src: string | null;
}

export default function ProfilePhotoModal({ opened, onClose, src }: ProfilePhotoModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Profile photo"
      centered
      size="auto"
      padding="md"
    >
      {src && (
        <Image
          src={src}
          alt="Profile photo enlarged"
          fit="contain"
          maw="min(90vw, 480px)"
          mah="70vh"
          radius="md"
        />
      )}
    </Modal>
  );
}
