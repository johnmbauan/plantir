import { describe, it, expect, afterEach } from 'vitest';
import i18n from '@/i18n';
import { getErrorMessage } from './error';

describe('getErrorMessage — English locale', () => {
  it('returns message from Error instances', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns message from objects with a message field', () => {
    expect(getErrorMessage({ message: 'from object' })).toBe('from object');
  });

  it('returns the English fallback for unknown values', () => {
    expect(getErrorMessage('plain string')).toBe('An unknown error occurred');
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
  });

  it('ignores a recognised Supabase error code when locale is English', () => {
    expect(
      getErrorMessage({ message: 'Invalid login credentials', code: 'invalid_credentials' }),
    ).toBe('Invalid login credentials');
  });
});

describe('getErrorMessage — Italian locale', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('translates a known Supabase error code to Italian', async () => {
    await i18n.changeLanguage('it');
    expect(
      getErrorMessage({ message: 'Invalid login credentials', code: 'invalid_credentials' }),
    ).toBe('Email o password non corretti.');
  });

  it('falls back to the original message for an unknown error code', async () => {
    await i18n.changeLanguage('it');
    expect(
      getErrorMessage({ message: 'Something went wrong', code: 'some_unknown_code' }),
    ).toBe('Something went wrong');
  });

  it('falls back to the original message when no code is present', async () => {
    await i18n.changeLanguage('it');
    expect(getErrorMessage({ message: 'no code here' })).toBe('no code here');
  });

  it('returns the Italian fallback for unknown values', async () => {
    await i18n.changeLanguage('it');
    expect(getErrorMessage('plain string')).toBe('Si è verificato un errore sconosciuto');
    expect(getErrorMessage(null)).toBe('Si è verificato un errore sconosciuto');
  });
});
