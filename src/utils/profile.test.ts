import { describe, it, expect } from 'vitest';
import { profileInitials } from './profile';

describe('profileInitials', () => {
  it('uses two initials from a multi-word nickname', () => {
    expect(profileInitials('Plant Fan', 'test@example.com')).toBe('PF');
  });

  it('uses first two letters for a single-word nickname', () => {
    expect(profileInitials('Green', 'test@example.com')).toBe('GR');
  });

  it('falls back to email when nickname is empty', () => {
    expect(profileInitials('', 'test@example.com')).toBe('TE');
    expect(profileInitials(null, 'test@example.com')).toBe('TE');
  });

  it('returns question mark when no nickname or email', () => {
    expect(profileInitials(null, undefined)).toBe('?');
  });
});
