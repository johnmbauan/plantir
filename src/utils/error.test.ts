import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './error';

describe('getErrorMessage', () => {
  it('returns message from Error instances', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns message from objects with a message field', () => {
    expect(getErrorMessage({ message: 'from object' })).toBe('from object');
  });

  it('returns a fallback for unknown values', () => {
    expect(getErrorMessage('plain string')).toBe('An unknown error occurred');
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
  });
});
