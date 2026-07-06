import '@/test/mocks/supabase'
import { describe, it, expect, beforeEach } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '@/test/render'
import { buildSession } from '@/test/builders/session'
import { mockSession, mockGetSession, resetSupabaseMocks } from '@/test/mocks/supabase'
import AuthGuard from '@/components/AuthGuard'

function renderGuard(route = '/') {
  return renderWithProviders(
    <Routes>
      <Route element={<AuthGuard />}>
        <Route path="/" element={<div>Protected content</div>} />
        <Route path="/dashboard" element={<div>Protected content</div>} />
      </Route>
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { route },
  )
}

describe('AuthGuard', () => {
  beforeEach(() => {
    resetSupabaseMocks()
  })

  it('redirects unauthenticated users to login', async () => {
    mockSession(null)
    renderGuard()

    expect(await screen.findByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders child routes when authenticated', async () => {
    mockSession(buildSession())
    renderGuard()

    expect(await screen.findByText('Protected content')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })

  it('shows a loader while session is loading', async () => {
    mockGetSession.mockReturnValue(new Promise(() => {}))
    renderGuard()

    await waitFor(() => {
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
      expect(screen.queryByText('Login page')).not.toBeInTheDocument()
    })
  })
})
