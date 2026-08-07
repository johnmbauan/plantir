import { describe, it, expect } from 'vitest';
import {
  HEADER_AVATAR_BORDER_WIDTH,
  HEADER_AVATAR_HEIGHT,
  HEADER_AVATAR_WIDTH,
  LEAF_AVATAR_SIZES,
  PROFILE_AVATAR_BORDER_WIDTH,
  PROFILE_AVATAR_HEIGHT,
  PROFILE_AVATAR_WIDTH,
  profileLeafAvatarStyle,
  profileLeafBorderStyle,
  profileLeafClipPath,
} from './leafShape';

describe('profileLeafClipPath', () => {
  it('builds a closed diagonal leaf path with petiole scaled to avatar dimensions', () => {
    const path = profileLeafClipPath(PROFILE_AVATAR_WIDTH, PROFILE_AVATAR_HEIGHT);

    expect(path).toMatch(/^path\('M /);
    expect(path).toContain('Z\'');
    expect(path).toContain(String((84 / 100) * PROFILE_AVATAR_WIDTH));
    expect(path).toContain(String((94 / 100) * PROFILE_AVATAR_HEIGHT));
  });

  it('returns width, height, and clip path together', () => {
    expect(profileLeafAvatarStyle()).toEqual({
      width: PROFILE_AVATAR_WIDTH,
      height: PROFILE_AVATAR_HEIGHT,
      clipPath: profileLeafClipPath(PROFILE_AVATAR_WIDTH, PROFILE_AVATAR_HEIGHT),
    });
  });

  it('returns a green leaf border style at profile size', () => {
    expect(profileLeafBorderStyle()).toEqual({
      width: PROFILE_AVATAR_WIDTH,
      height: PROFILE_AVATAR_HEIGHT,
      clipPath: profileLeafClipPath(PROFILE_AVATAR_WIDTH, PROFILE_AVATAR_HEIGHT),
      background: 'var(--green-500)',
    });
  });

  it('scales the green leaf border style to header avatar dimensions', () => {
    expect(profileLeafBorderStyle(HEADER_AVATAR_WIDTH, HEADER_AVATAR_HEIGHT)).toEqual({
      width: HEADER_AVATAR_WIDTH,
      height: HEADER_AVATAR_HEIGHT,
      clipPath: profileLeafClipPath(HEADER_AVATAR_WIDTH, HEADER_AVATAR_HEIGHT),
      background: 'var(--green-500)',
    });
  });

  it('maps profile and header leaf avatar size presets', () => {
    expect(LEAF_AVATAR_SIZES).toEqual({
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
    });
  });
});
