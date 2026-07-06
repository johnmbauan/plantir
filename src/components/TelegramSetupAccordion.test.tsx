import { describe, it, expect } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import TelegramSetupAccordion from './TelegramSetupAccordion'

describe('TelegramSetupAccordion', () => {
  it('shows setup instructions when expanded', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TelegramSetupAccordion />)

    await user.click(screen.getByText('How to set up Telegram notifications'))

    expect(await screen.findByText('Find your Chat ID')).toBeInTheDocument()
    expect(screen.getByText(/Start a conversation with the Plantir bot/)).toBeInTheDocument()
  })
})
