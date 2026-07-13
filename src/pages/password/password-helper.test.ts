import { afterEach, describe, it, expect } from 'vitest';
import { buildUser } from '@/test/builders/session';
import {
  captureInviteCallbackFromUrl,
  clearPendingPasswordSetup,
  markPendingPasswordSetup,
  needsPasswordSetup,
  validatePassword,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from './password-helper';

describe('needsPasswordSetup', () => {
  afterEach(() => {
    clearPendingPasswordSetup();
  });

  it('returns true when needs_password_setup metadata is true', () => {
    const user = buildUser({ user_metadata: { needs_password_setup: true } });
    expect(needsPasswordSetup(user)).toBe(true);
  });

  it('returns true when needs_password_setup metadata is the string "true"', () => {
    const user = buildUser({ user_metadata: { needs_password_setup: 'true' } });
    expect(needsPasswordSetup(user)).toBe(true);
  });

  it('returns true when invite callback flag is stored', () => {
    markPendingPasswordSetup();
    expect(needsPasswordSetup(buildUser())).toBe(true);
  });

  it('returns false when needs_password_setup metadata is false', () => {
    const user = buildUser({ user_metadata: { needs_password_setup: false } });
    expect(needsPasswordSetup(user)).toBe(false);
  });

  it('returns false when user is undefined', () => {
    expect(needsPasswordSetup(undefined)).toBe(false);
  });

  it('returns false when metadata is missing', () => {
    expect(needsPasswordSetup(buildUser())).toBe(false);
  });
});

describe('captureInviteCallbackFromUrl', () => {
  afterEach(() => {
    clearPendingPasswordSetup();
  });

  it('stores pending password setup for invite callback URLs', () => {
    expect(captureInviteCallbackFromUrl('https://plantir-smoky.vercel.app/#access_token=abc&type=invite')).toBe(true);
    expect(needsPasswordSetup(buildUser())).toBe(true);
  });

  it('stores pending password setup for invite query parameters', () => {
    expect(captureInviteCallbackFromUrl('https://plantir-smoky.vercel.app/?type=invite&code=abc')).toBe(true);
    expect(needsPasswordSetup(buildUser())).toBe(true);
  });

  it('ignores non-invite URLs', () => {
    expect(captureInviteCallbackFromUrl('https://plantir-smoky.vercel.app/')).toBe(false);
    expect(needsPasswordSetup(buildUser())).toBe(false);
  });
});

describe('validatePassword', () => {
  it('accepts a password that meets all requirements', () => {
    expect(validatePassword('Secret123')).toBeNull();
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('Secre1')).toBe(PASSWORD_REQUIREMENTS_MESSAGE);
  });

  it('rejects passwords without an uppercase letter', () => {
    expect(validatePassword('secret123')).toBe(PASSWORD_REQUIREMENTS_MESSAGE);
  });

  it('rejects passwords without a number', () => {
    expect(validatePassword('Secretpass')).toBe(PASSWORD_REQUIREMENTS_MESSAGE);
  });
});
