import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import TelegramSetupAccordion from './TelegramSetupAccordion';

async function expand(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('How to set up Telegram notifications'));
}

/** Returns all <a> elements matching a given href after expanding the accordion. */
function linksByHref(href: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`a[href="${href}"]`));
}

describe('TelegramSetupAccordion', () => {
  it('is collapsed by default', () => {
    renderWithProviders(<TelegramSetupAccordion />);

    expect(
      screen.getByRole('button', { name: /How to set up Telegram notifications/ }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows all three setup step titles when expanded', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TelegramSetupAccordion />);
    await expand(user);

    expect(await screen.findByText('Find your Chat ID')).toBeInTheDocument();
    expect(screen.getByText('Start a conversation with the Plantir bot')).toBeInTheDocument();
    expect(screen.getByText('Enter your Chat ID below and save')).toBeInTheDocument();
  });

  it('renders step 1 with a link to @userinfobot', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TelegramSetupAccordion />);
    await expand(user);

    await screen.findByText('Find your Chat ID');
    expect(linksByHref('https://t.me/userinfobot').length).toBeGreaterThanOrEqual(1);
  });

  it('renders step 2 with a link to @PlantirAlert_bot', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TelegramSetupAccordion />);
    await expand(user);

    await screen.findByText('Find your Chat ID');
    expect(linksByHref('https://t.me/PlantirAlert_bot').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the group tip title after expanding', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TelegramSetupAccordion />);
    await expand(user);

    expect(
      await screen.findByText('Want alerts for multiple people? Use a group'),
    ).toBeInTheDocument();
  });

  it('renders the group tip with links to both @PlantirAlert_bot and @userinfobot', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TelegramSetupAccordion />);
    await expand(user);

    await screen.findByText('Want alerts for multiple people? Use a group');

    expect(linksByHref('https://t.me/PlantirAlert_bot').length).toBeGreaterThanOrEqual(2);
    expect(linksByHref('https://t.me/userinfobot').length).toBeGreaterThanOrEqual(2);
  });

  it('step 3 body instructs users to paste the Chat ID and save', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TelegramSetupAccordion />);
    await expand(user);

    await screen.findByText('Enter your Chat ID below and save');
    expect(screen.getByText(/Paste the number from Step 1/)).toBeInTheDocument();
  });
});
