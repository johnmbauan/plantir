import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryChartHoverMarker from './HistoryChartHoverMarker';
import { CHART_HEIGHT, PADDING } from './utils';

describe('HistoryChartHoverMarker', () => {
  it('renders a guide line and point marker at the hover coordinates', () => {
    render(
      <svg>
        <HistoryChartHoverMarker
          point={{ x: 120, y: 45, value: 55, createdAt: '2026-07-06T12:00:00Z' }}
          color="green"
        />
      </svg>,
    );

    const line = screen.getByTestId('hover-guide');
    const circle = screen.getByTestId('hover-marker');

    expect(line).toHaveAttribute('x1', '120');
    expect(line).toHaveAttribute('x2', '120');
    expect(line).toHaveAttribute('y1', String(PADDING.top));
    expect(line).toHaveAttribute('y2', String(CHART_HEIGHT - PADDING.bottom));
    expect(circle).toHaveAttribute('cx', '120');
    expect(circle).toHaveAttribute('cy', '45');
    expect(circle).toHaveAttribute('fill', 'green');
  });
});
