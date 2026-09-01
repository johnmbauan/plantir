import { useTranslation } from "react-i18next";
import BrandLogo from "@/components/BrandLogo";
import { CONTACT_EMAIL, contactMailto } from "@/constants/contact";
import LandingContact from "./LandingContact";
import LandingDevicePhoto from "./LandingDevicePhoto";
import LandingHighlights from "./LandingHighlights";
import LandingHousehold from "./LandingHousehold";
import LandingNav from "./LandingNav";
import LandingSetup from "./LandingSetup";
import pageStyles from "./LandingPage.module.css";
import styles from "./LandingGarden.module.css";

function GardenSky() {
  return (
    <div className={styles.sky} aria-hidden>
      <svg className={styles.skySvg} viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="landingGardenSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8f2ec" />
            <stop offset="42%" stopColor="#d0e2d8" />
            <stop offset="100%" stopColor="#a0c8a8" />
          </linearGradient>
        </defs>
        <rect width="400" height="280" fill="url(#landingGardenSky)" />
        <circle cx="318" cy="48" r="26" fill="#fff8d0" opacity="0.88" />
        <path d="M0 168 Q90 128 190 158 T400 148 L400 280 L0 280 Z" fill="#90c098" />
        <path d="M0 208 Q130 176 230 202 T400 192 L400 280 L0 280 Z" fill="#68a072" />
      </svg>
    </div>
  );
}

export default function LandingMain() {
  const { t } = useTranslation();
  const href = contactMailto(t("landing.contact.subject"));

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <GardenSky />
        <LandingNav />
        <div className={styles.copy}>
          <h1 className={styles.headline}>{t("landing.hero.title")}</h1>
          <p className={styles.subtitle}>{t("landing.hero.subtitle")}</p>
          <div className={styles.heroActions}>
            <a className={pageStyles.cta} href={href}>
              {t("landing.contact.cta")}
            </a>
            <a className={styles.mailLink} href={href}>
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
        <div className={styles.stage}>
          <LandingDevicePhoto />
        </div>
      </section>

      <LandingHighlights />
      <LandingHousehold />
      <LandingSetup />
      <LandingContact />

      <footer className={styles.footer}>
        <BrandLogo />
      </footer>
    </main>
  );
}
