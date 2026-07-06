import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '@/test/render'
import { RefreshButton } from '@/admin/components/RefreshButton'

describe('RefreshButton', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    renderWithProviders(<RefreshButton onClick={onClick} label="Refresh devices" />)

    await user.click(screen.getByRole('button', { name: 'Refresh devices' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
