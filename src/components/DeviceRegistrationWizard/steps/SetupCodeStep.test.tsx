import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import SetupCodeStep from './SetupCodeStep'

const pairing = {
  tokenId: 'token-1',
  bundle: 'setup-code-abc',
  expiresAt: '2026-07-06T14:00:00Z',
}

describe('SetupCodeStep', () => {
  it('shows loading state while generating code', () => {
    renderWithProviders(
      <SetupCodeStep pairing={null} loading onGenerate={vi.fn()} />,
    )

    expect(screen.getByText('Generating setup code…')).toBeInTheDocument()
  })

  it('renders pairing bundle when available', () => {
    renderWithProviders(
      <SetupCodeStep pairing={pairing} loading={false} onGenerate={vi.fn()} />,
    )

    expect(screen.getByText('setup-code-abc')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy setup code' })).toBeInTheDocument()
  })

  it('calls onGenerate when generate button is clicked', async () => {
    const user = userEvent.setup()
    const onGenerate = vi.fn()

    renderWithProviders(
      <SetupCodeStep pairing={null} loading={false} onGenerate={onGenerate} />,
    )

    await user.click(screen.getByRole('button', { name: 'Generate setup code' }))

    expect(onGenerate).toHaveBeenCalledTimes(1)
  })
})
