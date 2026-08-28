import { afterEach, describe, it, expect } from 'vitest';
import i18n from '@/i18n';
import en from '@/i18n/locales/en.json';
import italian from '@/i18n/locales/it.json';
import { achievementCopy } from '@/utils/achievementDisplay';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('achievementCopy', () => {
  it('returns English catalog copy for a known achievement', () => {
    expect(achievementCopy('hello_my_name_is')).toEqual({
      name: 'Sprout Wars: A New Leaf',
      description: 'Create your first plant.',
    });
  });

  it('returns Italian catalog copy after the language changes', async () => {
    await i18n.changeLanguage('it');

    expect(achievementCopy('hello_my_name_is')).toEqual({
      name: "C'era una volta il vaso",
      description: 'Crea la tua prima pianta.',
    });
    expect(achievementCopy('back_from_the_mulch').name).toBe('La bella addormentata nel vaso');
    expect(achievementCopy('cloud_oracle').name).toBe('Cantando sotto la pioggia');
    expect(achievementCopy('the_comeback_kid').name).toBe('Sopravvissuto - The Martian');
    expect(achievementCopy('dirt_whisperer_initiate').name).toBe('Il silenzio dei vasi');
  });

  it('uses fallback copy when the achievement key has no translation', () => {
    expect(
      achievementCopy('not_a_real_badge', {
        name: 'Catalog name',
        description: 'Catalog description.',
      }),
    ).toEqual({
      name: 'Catalog name',
      description: 'Catalog description.',
    });
  });

  it('falls back to the key and an empty description when no fallback is given', () => {
    expect(achievementCopy('not_a_real_badge')).toEqual({
      name: 'not_a_real_badge',
      description: '',
    });
  });

  it('keeps English and Italian achievement catalogs in sync', () => {
    const englishKeys = Object.keys(en.garden.achievements).sort();
    const italianKeys = Object.keys(italian.garden.achievements).sort();

    expect(italianKeys).toEqual(englishKeys);

    for (const key of englishKeys) {
      const englishEntry = en.garden.achievements[key as keyof typeof en.garden.achievements];
      const italianEntry = italian.garden.achievements[key as keyof typeof italian.garden.achievements];
      expect(englishEntry.name).not.toBe('');
      expect(englishEntry.description).not.toBe('');
      expect(italianEntry.name).not.toBe('');
      expect(italianEntry.description).not.toBe('');
    }
  });
});
