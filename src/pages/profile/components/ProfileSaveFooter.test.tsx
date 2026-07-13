import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import ProfileSaveFooter from './ProfileSaveFooter';

describe('ProfileSaveFooter', () => {
  it('renders a submit save button', () => {
    renderWithProviders(<ProfileSaveFooter loading={false} saving={false} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toHaveAttribute('type', 'submit');
    expect(saveButton).toBeEnabled();
  });

  it('disables save while loading', () => {
    renderWithProviders(<ProfileSaveFooter loading saving={false} />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows loading state while saving', () => {
    renderWithProviders(<ProfileSaveFooter loading={false} saving />);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('data-loading', 'true');
  });
});
