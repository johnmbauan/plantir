import { useTranslation } from "react-i18next";
import styles from "./LandingGarden.module.css";

const STEPS = ["pot", "wifi", "alert"] as const;

export default function LandingSetup() {
  const { t } = useTranslation();

  return (
    <section className={styles.setupBand} aria-label={t("landing.setup.aria")}>
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>{t("landing.setup.eyebrow")}</p>
        <h2 className={styles.sectionTitle}>{t("landing.setup.title")}</h2>
        <p className={styles.sectionLead}>{t("landing.setup.lead")}</p>
        <ol className={styles.setupGrid}>
          {STEPS.map((key, index) => (
            <li key={key} className={styles.setupStep}>
              <span className={styles.setupNum}>{String(index + 1).padStart(2, "0")}</span>
              <h3 className={styles.cardTitle}>{t(`landing.setup.steps.${key}.title`)}</h3>
              <p className={styles.cardBody}>{t(`landing.setup.steps.${key}.body`)}</p>
            </li>
          ))}
        </ol>
        <p className={styles.batteryNote}>{t("landing.setup.battery")}</p>
      </div>
    </section>
  );
}
