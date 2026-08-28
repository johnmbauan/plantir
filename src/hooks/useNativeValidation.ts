import { useTranslation } from "react-i18next";
import type React from "react";

/**
 * Returns props to add to TextInput/PasswordInput so that browser-native
 * HTML5 validation messages are shown in the active locale instead of the
 * browser's system language.
 *
 * Usage:
 *   const { emailInputProps, requiredInputProps } = useNativeValidation();
 *   <TextInput type="email" {...emailInputProps} />
 *   <PasswordInput required {...requiredInputProps} />
 */
export function useNativeValidation() {
  const { t } = useTranslation();

  function clearValidity(e: React.FormEvent<HTMLInputElement>) {
    e.currentTarget.setCustomValidity("");
  }

  const emailInputProps = {
    onInvalid: (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      if (input.validity.valueMissing) {
        input.setCustomValidity(t("validation.required"));
      } else if (input.validity.typeMismatch) {
        input.setCustomValidity(t("validation.emailInvalid"));
      }
    },
    onInput: clearValidity,
  };

  const requiredInputProps = {
    onInvalid: (e: React.FormEvent<HTMLInputElement>) => {
      if (e.currentTarget.validity.valueMissing) {
        e.currentTarget.setCustomValidity(t("validation.required"));
      }
    },
    onInput: clearValidity,
  };

  return { emailInputProps, requiredInputProps };
}
