export const CONTACT_EMAIL = "ciao@plantir.green";

export function contactMailto(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
