import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockLookupTelegramChat = vi.fn();

vi.mock('@/services/notificationService', () => ({
  lookupTelegramChat: (...args: unknown[]) => mockLookupTelegramChat(...args),
}));

import { useTelegramChatLookup } from './useTelegramChatLookup';

describe('useTelegramChatLookup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockLookupTelegramChat.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts as idle when chatId is empty', () => {
    const { result } = renderHook(() => useTelegramChatLookup(''));
    expect(result.current.status).toBe('idle');
  });

  it('debounces the lookup until typing pauses', async () => {
    mockLookupTelegramChat.mockResolvedValue({ type: 'private', firstName: 'Alice' });

    const { result, rerender } = renderHook(({ chatId }) => useTelegramChatLookup(chatId), {
      initialProps: { chatId: '1' },
    });

    rerender({ chatId: '12' });
    rerender({ chatId: '123' });

    expect(mockLookupTelegramChat).not.toHaveBeenCalled();
    expect(result.current.status).toBe('loading');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(mockLookupTelegramChat).toHaveBeenCalledTimes(1);
    expect(mockLookupTelegramChat).toHaveBeenCalledWith('123');
    expect(result.current.status).toBe('success');
    expect(result.current.info).toEqual({ type: 'private', firstName: 'Alice' });
  });

  it('returns to idle when chatId is cleared', async () => {
    mockLookupTelegramChat.mockResolvedValue({ type: 'private', firstName: 'Alice' });

    const { result, rerender } = renderHook(({ chatId }) => useTelegramChatLookup(chatId), {
      initialProps: { chatId: '123456' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(result.current.status).toBe('success');

    rerender({ chatId: '' });

    expect(result.current.status).toBe('idle');
  });

  it('sets status to error with the code on lookup failure', async () => {
    const err = Object.assign(new Error('chat_not_found'), { code: 'chat_not_found' });
    mockLookupTelegramChat.mockRejectedValue(err);

    const { result } = renderHook(() => useTelegramChatLookup('999999999'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorCode).toBe('chat_not_found');
  });

  it('uses unknown when the rejected error has no code', async () => {
    mockLookupTelegramChat.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useTelegramChatLookup('123456789'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorCode).toBe('unknown');
  });

  it('does not call the service for whitespace-only input', async () => {
    const { result } = renderHook(() => useTelegramChatLookup('   '));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(mockLookupTelegramChat).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('ignores a stale error after the chatId changes', async () => {
    let rejectFirst: (reason: Error) => void = () => {};
    const firstLookup = new Promise<never>((_resolve, reject) => {
      rejectFirst = reject;
    });
    mockLookupTelegramChat
      .mockReturnValueOnce(firstLookup)
      .mockResolvedValueOnce({ type: 'private', firstName: 'Bob' });

    const { result, rerender } = renderHook(({ chatId }) => useTelegramChatLookup(chatId), {
      initialProps: { chatId: '111' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    rerender({ chatId: '222' });

    await act(async () => {
      rejectFirst(Object.assign(new Error('chat_not_found'), { code: 'chat_not_found' }));
      await firstLookup.catch(() => {});
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.errorCode).toBeUndefined();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(result.current.status).toBe('success');
    expect(result.current.info).toEqual({ type: 'private', firstName: 'Bob' });
  });

  it('ignores a stale result after the chatId changes', async () => {
    let resolveFirst: (value: { type: 'private'; firstName: string }) => void = () => {};
    const firstLookup = new Promise<{ type: 'private'; firstName: string }>((resolve) => {
      resolveFirst = resolve;
    });
    mockLookupTelegramChat
      .mockReturnValueOnce(firstLookup)
      .mockResolvedValueOnce({ type: 'private', firstName: 'Bob' });

    const { result, rerender } = renderHook(({ chatId }) => useTelegramChatLookup(chatId), {
      initialProps: { chatId: '111' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    rerender({ chatId: '222' });

    await act(async () => {
      resolveFirst({ type: 'private', firstName: 'Alice' });
      await firstLookup;
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.info).toBeUndefined();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(result.current.status).toBe('success');
    expect(result.current.info).toEqual({ type: 'private', firstName: 'Bob' });
  });
});
