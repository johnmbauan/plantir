import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import FormFooter from './FormFooter';

describe('FormFooter', () => {
  it('disables save when form is invalid', () => {
    renderWithProviders(
      <FormFooter isValid={false} saving={false} onCancel={vi.fn()} onSave={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('calls onSave when save is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <FormFooter isValid saving={false} onCancel={vi.fn()} onSave={onSave} />,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithProviders(
      <FormFooter isValid saving={false} onCancel={onCancel} onSave={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
