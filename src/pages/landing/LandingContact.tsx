import { useTranslation } from "react-i18next";
import { CONTACT_EMAIL, contactMailto } from "@/constants/contact";
import pageStyles from "./LandingPage.module.css";
import styles from "./LandingGarden.module.css";

export default function LandingContact() {
  const { t } = useTranslation();
  const href = contactMailto(t("landing.contact.subject"));

  return (
    <section className={styles.contactBand} aria-label={t("landing.contact.aria", { email: CONTACT_EMAIL })}>
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>{t("landing.contact.eyebrow")}</p>
        <h2 className={styles.sectionTitle}>{t("landing.contact.title")}</h2>
        <p className={styles.sectionLead}>{t("landing.contact.lead")}</p>
        <div className={styles.contactActions}>
          <a className={pageStyles.cta} href={href}>
            {t("landing.contact.cta")}
          </a>
          <a className={styles.mailLink} href={href}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
}
