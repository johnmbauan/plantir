import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import HistoryChartTooltip from './HistoryChartTooltip';
import { CHART_WIDTH, formatHoverDate } from './utils';

function tooltipStyle(): string {
  return screen.getByText('55%').parentElement?.getAttribute('style') ?? '';
}

describe('HistoryChartTooltip', () => {
  const createdAt = '2026-07-06T12:00:00Z';

  it('shows value and formatted date centered above the point', () => {
    renderWithProviders(
      <HistoryChartTooltip
        point={{ x: CHART_WIDTH / 2, y: 40, value: 55, createdAt }}
        unit="%"
      />,
    );

    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText(formatHoverDate(createdAt))).toBeInTheDocument();
    expect(tooltipStyle()).toContain('translate(-50%, calc(-100% - 10px))');
  });

  it('anchors to the left when near the left edge', () => {
    renderWithProviders(
      <HistoryChartTooltip
        point={{ x: 20, y: 40, value: 55, createdAt }}
        unit="%"
      />,
    );

    expect(tooltipStyle()).toContain('translate(10px, -50%)');
  });

  it('anchors to the right when near the right edge', () => {
    renderWithProviders(
      <HistoryChartTooltip
        point={{ x: CHART_WIDTH - 20, y: 40, value: 55, createdAt }}
        unit="%"
      />,
    );

    expect(tooltipStyle()).toContain('translate(calc(-100% - 10px), -50%)');
  });
});
