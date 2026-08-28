import { Image, Modal } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface ProfilePhotoModalProps {
  opened: boolean;
  onClose: () => void;
  src: string | null;
}

export default function ProfilePhotoModal({ opened, onClose, src }: ProfilePhotoModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("profile.avatar.modalTitle")}
      centered
      size="auto"
      padding="md"
    >
      {src && (
        <Image
          src={src}
          alt={t("profile.avatar.enlargedAlt")}
          fit="contain"
          maw="min(90vw, 480px)"
          mah="70vh"
          radius="md"
        />
      )}
    </Modal>
  );
}
