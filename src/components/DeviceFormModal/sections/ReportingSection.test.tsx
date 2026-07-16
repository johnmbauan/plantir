import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/react';
import { renderWithProviders, screen } from '@/test/render';
import { DEFAULT_HUMIDITY_CONFIG } from '@/constants/deviceDefaults';
import ReportingSection from './ReportingSection';

const recommendedInterval = String(DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds);

describe('ReportingSection', () => {
  it('renders reporting interval preset select', () => {
    renderWithProviders(
      <ReportingSection
        intervalPreset={recommendedInterval}
        intervalSeconds={DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds}
        validation={{}}
        onPresetChange={vi.fn()}
        onCustomIntervalChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('textbox', { name: /Reporting interval/i })).toBeInTheDocument();
  });

  it('shows a battery drain disclaimer', () => {
    renderWithProviders(
      <ReportingSection
        intervalPreset={recommendedInterval}
        intervalSeconds={DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds}
        validation={{}}
        onPresetChange={vi.fn()}
        onCustomIntervalChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Higher frequencies drain the battery faster/i),
    ).toBeInTheDocument();
  });

  it('shows a Recommended badge on the 8h interval option', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ReportingSection
        intervalPreset={recommendedInterval}
        intervalSeconds={DEFAULT_HUMIDITY_CONFIG.sleepDurationSeconds}
        validation={{}}
        onPresetChange={vi.fn()}
        onCustomIntervalChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('textbox', { name: /Reporting interval/i }));

    // Mantine keeps combobox options in a hidden portal until layout completes in jsdom.
    // eslint-disable-next-line testing-library/no-node-access
    const recommendedOption = document.querySelector(
      `[data-combobox-option][value="${recommendedInterval}"]`,
    );
    expect(recommendedOption).toBeTruthy();
    expect(within(recommendedOption as HTMLElement).getByText('Recommended')).toBeInTheDocument();

    // eslint-disable-next-line testing-library/no-node-access
    const otherOption = document.querySelector('[data-combobox-option][value="3600"]');
    expect(otherOption).toBeTruthy();
    expect(within(otherOption as HTMLElement).queryByText('Recommended')).not.toBeInTheDocument();
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
