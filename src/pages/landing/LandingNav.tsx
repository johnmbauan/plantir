import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BrandLogo from "@/components/BrandLogo";
import { contactMailto } from "@/constants/contact";
import GuestLanguageToggle from "./GuestLanguageToggle";
import styles from "./LandingPage.module.css";

export default function LandingNav() {
  const { t } = useTranslation();

  return (
    <header className={styles.nav}>
      <Link to="/" className={styles.logoLink} aria-label={t("nav.homeAria")}>
        <BrandLogo />
      </Link>
      <div className={styles.navActions}>
        <GuestLanguageToggle />
        <Link to="/login" className={styles.navLink}>
          {t("auth.login.signIn")}
        </Link>
        <a className={styles.cta} href={contactMailto(t("landing.contact.subject"))}>
          {t("landing.contact.navCta")}
        </a>
      </div>
    </header>
  );
}
