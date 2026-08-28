import { useRef, type MutableRefObject } from "react";
import { ActionIcon, FileButton, Menu, Stack, Text } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import LeafAvatar from "@/components/LeafAvatar";

interface ProfileAvatarSectionProps {
  previewSrc: string | null;
  initials: string;
  avatarFile: File | null;
  showRemovePhoto: boolean;
  loading: boolean;
  saving: boolean;
  resetFileRef: MutableRefObject<(() => void) | null>;
  onExpand: () => void;
  onFileChange: (file: File | null) => void;
  onRemovePhoto: () => void;
}

export default function ProfileAvatarSection({
  previewSrc,
  initials,
  avatarFile,
  showRemovePhoto,
  loading,
  saving,
  resetFileRef,
  onExpand,
  onFileChange,
  onRemovePhoto,
}: ProfileAvatarSectionProps) {
  const { t } = useTranslation();
  const openFilePickerRef = useRef<(() => void) | null>(null);
  const actionsDisabled = loading || saving;
  const uploadLabel = previewSrc ? t("profile.avatar.replacePhoto") : t("profile.avatar.uploadPhoto");

  return (
    <Stack gap="xs" align="flex-start">
      <FileButton
        resetRef={resetFileRef}
        onChange={onFileChange}
        accept="image/*"
        disabled={actionsDisabled}
        inputProps={{ "aria-label": t("profile.avatar.fileAria") }}
      >
        {(props) => {
          openFilePickerRef.current = props.onClick;
          return (
            <button
              type="button"
              {...props}
              tabIndex={-1}
              aria-hidden="true"
              style={{ display: "none" }}
            >
              {t("profile.avatar.upload")}
            </button>
          );
        }}
      </FileButton>

      <LeafAvatar
        src={previewSrc}
        initials={initials}
        alt={t("profile.avatar.alt")}
        onClick={previewSrc ? onExpand : undefined}
        clickAriaLabel={t("profile.avatar.viewAria")}
      >
        <Menu
          trigger="click-hover"
          openDelay={100}
          closeDelay={150}
          position="bottom-end"
          shadow="md"
          width={180}
          withinPortal
        >
          <Menu.Target>
            <ActionIcon
              aria-label={t("profile.avatar.editAria")}
              size="sm"
              radius="xl"
              variant="filled"
              color="var(--green-700)"
              disabled={actionsDisabled}
              style={{
                position: "absolute",
                top: "10%",
                right: "8%",
                boxShadow: "0 1px 6px rgba(74, 43, 28, 0.2)",
              }}
            >
              <IconPencil size={14} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              onClick={() => openFilePickerRef.current?.()}
              disabled={actionsDisabled}
            >
              {uploadLabel}
            </Menu.Item>
            {showRemovePhoto && (
              <Menu.Item onClick={onRemovePhoto} disabled={actionsDisabled} color="red">
                {t("profile.avatar.removePhoto")}
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </LeafAvatar>

      {avatarFile && (
        <Text size="sm" c="dimmed" truncate maw={240}>
          {avatarFile.name}
        </Text>
      )}
    </Stack>
  );
}
