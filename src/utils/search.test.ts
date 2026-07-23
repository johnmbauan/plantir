import { describe, it, expect } from 'vitest';
import { matchesAnySearchField } from '@/utils/search';

describe('matchesAnySearchField', () => {
  it('matches empty query against any fields', () => {
    expect(matchesAnySearchField('', ['Fern'])).toBe(true);
    expect(matchesAnySearchField('   ', [])).toBe(true);
  });

  it('matches case-insensitively across fields and ignores nulls', () => {
    expect(matchesAnySearchField('fer', ['Monstera', 'Fern', null])).toBe(true);
    expect(matchesAnySearchField('zzz', ['Monstera', null])).toBe(false);
  });
});
