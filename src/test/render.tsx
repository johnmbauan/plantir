import { render, type RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { WeatherCityProvider } from '@/context/WeatherCityContext';
import { LanguageContext } from '@/context/LanguageContext';

/**
 * Provides a static English locale without making any DB calls.
 * Components using useLanguage() receive locale='en' and a no-op setLocale.
 */
function MockLanguageProvider({ children }: { children: ReactNode }) {
  return (
    <LanguageContext.Provider value={{ locale: 'en', setLocale: async () => {} }}>
      {children}
    </LanguageContext.Provider>
  );
}

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
        <AuthProvider>
          <ProfileProvider>
            <MockLanguageProvider>
              <WeatherCityProvider>{children}</WeatherCityProvider>
            </MockLanguageProvider>
          </ProfileProvider>
        </AuthProvider>
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
