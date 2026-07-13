export const NICKNAME_MAX_LENGTH = 50;

export { PROFILE_AVATAR_WIDTH, PROFILE_AVATAR_HEIGHT } from "./leafShape";

/** @deprecated Use PROFILE_AVATAR_WIDTH */
export const PROFILE_AVATAR_SIZE = 144;

export const cardStyle = { border: "1px solid var(--terracotta-100)" };

export const stickyFooterStyle = {
  position: "sticky" as const,
  bottom: 0,
  zIndex: 2,
  border: "1px solid var(--terracotta-100)",
  background: "var(--terracotta-50)",
  boxShadow: "0 -4px 16px rgba(74, 43, 28, 0.06)",
};
