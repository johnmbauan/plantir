export const PROFILE_AVATAR_WIDTH = 156;

/** Square bounds so the diagonal leaf and petiole fit comfortably. */
export const PROFILE_AVATAR_HEIGHT = 156;

/** Compact leaf avatar for the header account menu. */
export const HEADER_AVATAR_WIDTH = 36;
export const HEADER_AVATAR_HEIGHT = 36;

/**
 * Diagonal leaf with petiole: tip top-right, petiole extending bottom-left.
 * The stalk continues the midrib past the leaf base.
 */
export function profileLeafClipPath(
  width: number = PROFILE_AVATAR_WIDTH,
  height: number = PROFILE_AVATAR_HEIGHT,
): string {
  const sx = (x: number) => (x / 100) * width;
  const sy = (y: number) => (y / 100) * height;

  return [
    `path('M ${sx(84)} ${sy(16)}`,
    `C ${sx(65)} ${sy(9)}, ${sx(32)} ${sy(17)}, ${sx(20)} ${sy(30)}`,
    `C ${sx(10)} ${sy(45)}, ${sx(8)} ${sy(60)}, ${sx(14)} ${sy(81)}`,
    `C ${sx(11)} ${sy(84)}, ${sx(7)} ${sy(89)}, ${sx(5)} ${sy(94)}`,
    `C ${sx(8)} ${sy(96)}, ${sx(13)} ${sy(93)}, ${sx(18)} ${sy(88)}`,
    `C ${sx(21)} ${sy(92)}, ${sx(54)} ${sy(87)}, ${sx(66)} ${sy(75)}`,
    `C ${sx(80)} ${sy(61)}, ${sx(94)} ${sy(40)}, ${sx(84)} ${sy(16)}`,
    `Z')`,
  ].join(" ");
}

export function profileLeafAvatarStyle(
  width: number = PROFILE_AVATAR_WIDTH,
  height: number = PROFILE_AVATAR_HEIGHT,
) {
  return {
    width,
    height,
    clipPath: profileLeafClipPath(width, height),
  } as const;
}

/** Leaf outline painted behind a slightly smaller clipped avatar. */
export const PROFILE_AVATAR_BORDER_WIDTH = 3;
export const HEADER_AVATAR_BORDER_WIDTH = 2;

export const LEAF_AVATAR_SIZES = {
  profile: {
    width: PROFILE_AVATAR_WIDTH,
    height: PROFILE_AVATAR_HEIGHT,
    borderWidth: PROFILE_AVATAR_BORDER_WIDTH,
  },
  header: {
    width: HEADER_AVATAR_WIDTH,
    height: HEADER_AVATAR_HEIGHT,
    borderWidth: HEADER_AVATAR_BORDER_WIDTH,
  },
} as const;

export type LeafAvatarSize = keyof typeof LEAF_AVATAR_SIZES;

export function profileLeafBorderStyle(
  width: number = PROFILE_AVATAR_WIDTH,
  height: number = PROFILE_AVATAR_HEIGHT,
) {
  return {
    ...profileLeafAvatarStyle(width, height),
    background: "var(--green-500)",
  } as const;
}
