import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import ReadingCountdownBar from './ReadingCountdownBar';

describe('ReadingCountdownBar', () => {
  it('renders countdown progress and helper text', () => {
    renderWithProviders(<ReadingCountdownBar />);
    expect(screen.getByText('The sensor sends a reading every 10 seconds')).toBeInTheDocument();
  });

  it('advances progress as timers elapse', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      vi.setSystemTime(new Date('2026-07-06T12:00:00Z'));
      renderWithProviders(<ReadingCountdownBar />);

      const progress = screen.getByRole('progressbar');
      const initial = Number(progress.getAttribute('aria-valuenow'));
      vi.setSystemTime(new Date('2026-07-06T12:00:05Z'));
      await vi.advanceTimersByTimeAsync(50);
      const mid = Number(progress.getAttribute('aria-valuenow'));

      expect(mid).toBeGreaterThan(initial);
      expect(mid).toBeGreaterThanOrEqual(49);
      expect(mid).toBeLessThanOrEqual(51);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resets progress when resetKey changes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      vi.setSystemTime(new Date('2026-07-06T12:00:00Z'));
      const { rerender } = renderWithProviders(<ReadingCountdownBar resetKey={0} />);

      vi.setSystemTime(new Date('2026-07-06T12:00:05Z'));
      await vi.advanceTimersByTimeAsync(50);
      const mid = Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));
      expect(mid).toBeGreaterThanOrEqual(49);

      rerender(<ReadingCountdownBar resetKey={1} />);
      vi.setSystemTime(new Date('2026-07-06T12:00:00Z'));
      await vi.advanceTimersByTimeAsync(50);
      const reset = Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));

      expect(reset).toBeLessThan(10);
    } finally {
      vi.useRealTimers();
    }
  });
});
