import { useTranslation } from "react-i18next";
import styles from "./LandingGarden.module.css";

export default function LandingHousehold() {
  const { t } = useTranslation();

  return (
    <section className={styles.householdBand} aria-label={t("landing.household.aria")}>
      <div className={`${styles.sectionInner} ${styles.householdInner}`}>
        <div>
          <p className={styles.eyebrow}>{t("landing.household.eyebrow")}</p>
          <h2 className={styles.sectionTitle}>{t("landing.household.title")}</h2>
          <p className={styles.sectionLead}>{t("landing.household.body")}</p>
        </div>
        <div className={styles.chat} aria-hidden>
          <p className={styles.chatFrom}>{t("landing.household.messageFrom")}</p>
          <p className={styles.chatBubble}>{t("landing.household.messageText")}</p>
        </div>
      </div>
    </section>
  );
}
