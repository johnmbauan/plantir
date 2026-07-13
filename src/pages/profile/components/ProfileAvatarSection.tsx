import { useRef, type MutableRefObject } from "react";
import {
  ActionIcon,
  Avatar,
  Box,
  FileButton,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import {
  PROFILE_AVATAR_HEIGHT,
  PROFILE_AVATAR_WIDTH,
  profileLeafAvatarStyle,
} from "@/pages/profile/leafShape";

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
  const openFilePickerRef = useRef<(() => void) | null>(null);
  const actionsDisabled = loading || saving;
  const uploadLabel = previewSrc ? "Replace photo" : "Upload photo";
  const leafStyle = profileLeafAvatarStyle();

  return (
    <Stack gap="xs" align="flex-start">
      <FileButton
        resetRef={resetFileRef}
        onChange={onFileChange}
        accept="image/*"
        disabled={actionsDisabled}
        inputProps={{ "aria-label": "Profile photo file" }}
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
              Upload
            </button>
          );
        }}
      </FileButton>

      <Box pos="relative" w={PROFILE_AVATAR_WIDTH} h={PROFILE_AVATAR_HEIGHT}>
        {previewSrc ? (
          <UnstyledButton
            onClick={onExpand}
            aria-label="View profile photo"
            style={{ ...leafStyle, lineHeight: 0, cursor: "pointer", border: "none", padding: 0 }}
          >
            <Avatar
              src={previewSrc}
              alt="Profile avatar"
              radius={0}
              w={PROFILE_AVATAR_WIDTH}
              h={PROFILE_AVATAR_HEIGHT}
              style={leafStyle}
            />
          </UnstyledButton>
        ) : (
          <Avatar
            alt="Profile avatar"
            radius={0}
            w={PROFILE_AVATAR_WIDTH}
            h={PROFILE_AVATAR_HEIGHT}
            style={leafStyle}
          >
            {initials}
          </Avatar>
        )}

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
              aria-label="Edit profile photo"
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
                Remove photo
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Box>

      {avatarFile && (
        <Text size="sm" c="dimmed" truncate maw={240}>
          {avatarFile.name}
        </Text>
      )}
    </Stack>
  );
}
