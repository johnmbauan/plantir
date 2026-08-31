import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BrandLogo from "@/components/BrandLogo";
import LandingGlimpse from "./LandingGlimpse";
import LandingNav from "./LandingNav";
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

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <GardenSky />
        <LandingNav />
        <div className={styles.copy}>
          <h1 className={styles.headline}>{t("landing.hero.title")}</h1>
          <p className={styles.subtitle}>{t("landing.hero.subtitle")}</p>
          <Link to="/login" className={pageStyles.cta}>
            {t("auth.login.signIn")}
          </Link>
        </div>
        <div className={styles.stage}>
          <LandingGlimpse />
        </div>
      </section>

      <section className={styles.steps} aria-label={t("landing.stepsAria")}>
        <article className={styles.step}>
          <span className={styles.stepIndex}>1</span>
          <h2 className={styles.stepTitle}>{t("landing.features.moisture.title")}</h2>
          <p className={styles.stepBody}>{t("landing.features.moisture.body")}</p>
        </article>
        <article className={styles.step}>
          <span className={styles.stepIndex}>2</span>
          <h2 className={styles.stepTitle}>{t("landing.features.rain.title")}</h2>
          <p className={styles.stepBody}>{t("landing.features.rain.body")}</p>
        </article>
        <article className={styles.step}>
          <span className={styles.stepIndex}>3</span>
          <h2 className={styles.stepTitle}>{t("landing.features.garden.title")}</h2>
          <p className={styles.stepBody}>{t("garden.footer")}</p>
        </article>
      </section>

      <footer className={styles.footer}>
        <BrandLogo />
        <Link to="/login" className={pageStyles.cta}>
          {t("auth.login.signIn")}
        </Link>
      </footer>
    </main>
  );
}
