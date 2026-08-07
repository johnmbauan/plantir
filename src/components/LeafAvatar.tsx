import type { ReactNode } from "react";
import { Avatar, Box, UnstyledButton } from "@mantine/core";
import {
  LEAF_AVATAR_SIZES,
  type LeafAvatarSize,
  profileLeafAvatarStyle,
  profileLeafBorderStyle,
} from "@/pages/profile/leafShape";

interface LeafAvatarProps {
  size?: LeafAvatarSize;
  src?: string | null;
  initials?: string;
  alt: string;
  /** When set, the leaf photo becomes a button (e.g. expand preview). */
  onClick?: () => void;
  clickAriaLabel?: string;
  /** Overlay content positioned relative to the outer leaf frame (e.g. edit control). */
  children?: ReactNode;
}

export default function LeafAvatar({
  size = "profile",
  src = null,
  initials,
  alt,
  onClick,
  clickAriaLabel,
  children,
}: LeafAvatarProps) {
  const { width, height, borderWidth } = LEAF_AVATAR_SIZES[size];
  const innerWidth = width - borderWidth * 2;
  const innerHeight = height - borderWidth * 2;
  const leafStyle = profileLeafAvatarStyle(innerWidth, innerHeight);

  const avatar = (
    <Avatar
      src={src ?? undefined}
      alt={alt}
      radius={0}
      w={innerWidth}
      h={innerHeight}
      style={leafStyle}
    >
      {initials}
    </Avatar>
  );

  return (
    <Box pos="relative" w={width} h={height}>
      <Box
        aria-hidden
        data-testid="profile-leaf-border"
        style={{
          ...profileLeafBorderStyle(width, height),
          position: "absolute",
          inset: 0,
        }}
      />

      <Box
        pos="absolute"
        top={borderWidth}
        left={borderWidth}
        w={innerWidth}
        h={innerHeight}
      >
        {onClick ? (
          <UnstyledButton
            onClick={onClick}
            aria-label={clickAriaLabel}
            style={{ ...leafStyle, lineHeight: 0, cursor: "pointer", border: "none", padding: 0 }}
          >
            {avatar}
          </UnstyledButton>
        ) : (
          avatar
        )}
      </Box>

      {children}
    </Box>
  );
}
