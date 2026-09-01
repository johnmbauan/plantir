import '@/test/mocks/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import i18n from '@/i18n';
import type { NotificationSettings } from '@/services/notificationService';
import { LanguageProvider, useLanguage } from './LanguageContext';

vi.mock('@/services/notificationService', () => ({
  fetchSettings: vi.fn(),
  updateLocale: vi.fn(),
}));

import { fetchSettings, updateLocale } from '@/services/notificationService';

const mockFetchSettings = vi.mocked(fetchSettings);
const mockUpdateLocale = vi.mocked(updateLocale);

function buildSettings(locale: string): NotificationSettings {
  return {
    id: 1,
    telegram_chat_id: '',
    notification_hour: 8,
    notification_timezone: 'UTC',
    browser_notifications_enabled: false,
    email_notifications_enabled: false,
    locale,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe('LanguageContext', () => {
  beforeEach(() => {
    mockFetchSettings.mockReset();
    mockUpdateLocale.mockReset();
    mockUpdateLocale.mockResolvedValue(undefined);
  });

  it('applies the saved locale fetched from settings', async () => {
    mockFetchSettings.mockResolvedValue(buildSettings('en'));

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(result.current.locale).toBe('en'));
    expect(i18n.language).toBe('en');
  });

  it('applies Italian when the saved locale is "it"', async () => {
    mockFetchSettings.mockResolvedValue(buildSettings('it'));

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(result.current.locale).toBe('it'));
    expect(i18n.language).toBe('it');

    // Restore for other tests
    await act(async () => { await i18n.changeLanguage('en'); });
  });

  it('falls back to Italian when fetchSettings rejects', async () => {
    mockFetchSettings.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useLanguage(), { wrapper });

    // Default is 'it' — still 'it' after the rejection
    await waitFor(() => expect(mockFetchSettings).toHaveBeenCalled());
    expect(result.current.locale).toBe('it');
  });

  it('setLocale updates the locale in state and persists via updateLocale', async () => {
    mockFetchSettings.mockResolvedValue(buildSettings('en'));
    mockUpdateLocale.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(result.current.locale).toBe('en'));

    act(() => {
      void result.current.setLocale('it');
    });

    await waitFor(() => expect(result.current.locale).toBe('it'));
    await waitFor(() => expect(mockUpdateLocale).toHaveBeenCalledWith('it'));

    // Restore
    await act(async () => { await i18n.changeLanguage('en'); });
  });

  it('useLanguage throws when used outside LanguageProvider', () => {
    expect(() => renderHook(() => useLanguage())).toThrow(
      'useLanguage must be used inside LanguageProvider',
    );
  });
});
