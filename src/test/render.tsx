import { render, type RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';

export { screen, waitFor, within } from '@testing-library/react';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string
  routerProps?: MemoryRouterProps
}

function AllProviders({
  children,
  route = '/',
  routerProps,
}: {
  children: ReactNode
  route?: string
  routerProps?: MemoryRouterProps
}) {
  return (
    <MantineProvider>
      <MemoryRouter initialEntries={[route]} {...routerProps}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </MantineProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  { route, routerProps, ...options }: RenderWithProvidersOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders route={route} routerProps={routerProps}>
        {children}
      </AllProviders>
    ),
    ...options,
  });
}
