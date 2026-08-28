import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type React from 'react';
import { useNativeValidation } from './useNativeValidation';

function makeEvent(validityOverrides: Partial<ValidityState> = {}): React.FormEvent<HTMLInputElement> {
  const input = {
    validity: {
      valueMissing: false,
      typeMismatch: false,
      ...validityOverrides,
    } as ValidityState,
    setCustomValidity: vi.fn(),
  };
  return { currentTarget: input } as unknown as React.FormEvent<HTMLInputElement>;
}

describe('useNativeValidation', () => {
  describe('emailInputProps.onInvalid', () => {
    it('sets the required message when the value is missing', () => {
      const { result } = renderHook(() => useNativeValidation());
      const event = makeEvent({ valueMissing: true });

      result.current.emailInputProps.onInvalid(event);

      expect((event.currentTarget as HTMLInputElement).setCustomValidity).toHaveBeenCalledWith(
        'Please fill in this field.',
      );
    });

    it('sets the email-invalid message when the type is mismatched', () => {
      const { result } = renderHook(() => useNativeValidation());
      const event = makeEvent({ typeMismatch: true });

      result.current.emailInputProps.onInvalid(event);

      expect((event.currentTarget as HTMLInputElement).setCustomValidity).toHaveBeenCalledWith(
        'Please enter a valid email address.',
      );
    });

    it('does not call setCustomValidity for unrecognised validity states', () => {
      const { result } = renderHook(() => useNativeValidation());
      const event = makeEvent({});

      result.current.emailInputProps.onInvalid(event);

      expect((event.currentTarget as HTMLInputElement).setCustomValidity).not.toHaveBeenCalled();
    });
  });

  describe('emailInputProps.onInput', () => {
    it('clears custom validity so the browser stops showing the error', () => {
      const { result } = renderHook(() => useNativeValidation());
      const event = makeEvent();

      result.current.emailInputProps.onInput(event);

      expect((event.currentTarget as HTMLInputElement).setCustomValidity).toHaveBeenCalledWith('');
    });
  });

  describe('requiredInputProps.onInvalid', () => {
    it('sets the required message when the value is missing', () => {
      const { result } = renderHook(() => useNativeValidation());
      const event = makeEvent({ valueMissing: true });

      result.current.requiredInputProps.onInvalid(event);

      expect((event.currentTarget as HTMLInputElement).setCustomValidity).toHaveBeenCalledWith(
        'Please fill in this field.',
      );
    });

    it('does not call setCustomValidity when the value is present', () => {
      const { result } = renderHook(() => useNativeValidation());
      const event = makeEvent({ valueMissing: false });

      result.current.requiredInputProps.onInvalid(event);

      expect((event.currentTarget as HTMLInputElement).setCustomValidity).not.toHaveBeenCalled();
    });
  });

  describe('requiredInputProps.onInput', () => {
    it('clears custom validity on input', () => {
      const { result } = renderHook(() => useNativeValidation());
      const event = makeEvent();

      result.current.requiredInputProps.onInput(event);

      expect((event.currentTarget as HTMLInputElement).setCustomValidity).toHaveBeenCalledWith('');
    });
  });
});
