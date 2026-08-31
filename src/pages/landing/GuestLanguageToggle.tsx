import { SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { writeGuestLocale, type GuestLocale } from "@/i18n/guestLocale";

export default function GuestLanguageToggle() {
  const { t, i18n } = useTranslation();
  const locale: GuestLocale = i18n.language.startsWith("en") ? "en" : "it";

  function handleChange(next: string) {
    const value = next === "en" ? "en" : "it";
    writeGuestLocale(value);
    void i18n.changeLanguage(value);
  }

  return (
    <SegmentedControl
      size="xs"
      value={locale}
      onChange={handleChange}
      aria-label={t("landing.language.label")}
      data={[
        { label: t("landing.language.it"), value: "it" },
        { label: t("landing.language.en"), value: "en" },
      ]}
    />
  );
}
