import i18n from "@/i18n";
import { supabaseAuthErrorsIT } from "./supabaseErrors.it";

interface CodedError {
  message: string;
  code?: string;
}

function isCodedError(err: unknown): err is CodedError {
  return (
    err != null &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as Record<string, unknown>).message === "string"
  );
}

export function getErrorMessage(err: unknown): string {
  const locale = i18n.language;

  if (isCodedError(err)) {
    if (locale === "it") {
      const code = (err as unknown as Record<string, unknown>).code;
      if (typeof code === "string" && supabaseAuthErrorsIT[code]) {
        return supabaseAuthErrorsIT[code];
      }
    }
    return (err as CodedError).message;
  }

  if (err instanceof Error) return err.message;

  return locale === "it"
    ? "Si è verificato un errore sconosciuto"
    : "An unknown error occurred";
}
