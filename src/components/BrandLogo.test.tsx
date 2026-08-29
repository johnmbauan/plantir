import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import BrandLogo from '@/components/BrandLogo';

describe('BrandLogo', () => {
  it('renders the header mark and wordmark', () => {
    renderWithProviders(<BrandLogo />);

    expect(screen.getByText('Plantir')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Plantir' })).not.toBeInTheDocument();

    const mark = screen.getByTestId('brand-logo-mark');
    expect(mark).toHaveAttribute('src', '/logo.svg');
    expect(mark).toHaveAttribute('alt', '');
    expect(mark).toHaveAttribute('height', '28');
    expect(mark).toHaveAttribute('width', '27');
  });

  it('renders the auth mark as a heading', () => {
    renderWithProviders(<BrandLogo variant="auth" />);

    expect(screen.getByRole('heading', { name: 'Plantir' })).toBeInTheDocument();

    const mark = screen.getByTestId('brand-logo-mark');
    expect(mark).toHaveAttribute('src', '/logo.svg');
    expect(mark).toHaveAttribute('alt', '');
    expect(mark).toHaveAttribute('height', '40');
    expect(mark).toHaveAttribute('width', '38');
  });
});
