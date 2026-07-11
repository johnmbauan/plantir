import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import ReportingSection from './ReportingSection';

describe('ReportingSection', () => {
  it('renders reporting interval preset select', () => {
    renderWithProviders(
      <ReportingSection
        intervalPreset="28800"
        intervalSeconds={28800}
        validation={{}}
        onPresetChange={vi.fn()}
        onCustomIntervalChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Reporting')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Reporting interval/i })).toBeInTheDocument();
  });

  it('shows custom interval input when custom preset is selected', () => {
    renderWithProviders(
      <ReportingSection
        intervalPreset="custom"
        intervalSeconds={30}
        validation={{}}
        onPresetChange={vi.fn()}
        onCustomIntervalChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Custom interval (seconds)')).toBeInTheDocument();
    expect(screen.getByText(/Short intervals drain the battery faster/i)).toBeInTheDocument();
  });

  it('shows interval validation error', () => {
    renderWithProviders(
      <ReportingSection
        intervalPreset="custom"
        intervalSeconds={0}
        validation={{ interval: 'Interval must be at least 1 second' }}
        onPresetChange={vi.fn()}
        onCustomIntervalChange={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Interval must be at least 1 second').length).toBeGreaterThan(0);
  });
});
