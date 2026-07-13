import { describe, it, expect } from 'vitest';
import {
  PROFILE_AVATAR_HEIGHT,
  PROFILE_AVATAR_WIDTH,
  profileLeafAvatarStyle,
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
});
