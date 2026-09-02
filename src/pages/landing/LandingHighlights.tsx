import { useTranslation } from "react-i18next";
import { IconCloudRain, IconDroplet, IconWifi } from "@tabler/icons-react";
import styles from "./LandingGarden.module.css";

const ITEMS = [
  { key: "moisture", icon: IconDroplet },
  { key: "wifi", icon: IconWifi },
  { key: "weather", icon: IconCloudRain },
] as const;

export default function LandingHighlights() {
  const { t } = useTranslation();

  return (
    <section className={styles.band} aria-label={t("landing.highlights.aria")}>
      <div className={styles.sectionInner}>
        <p className={styles.eyebrow}>{t("landing.highlights.eyebrow")}</p>
        <h2 className={styles.sectionTitle}>{t("landing.highlights.title")}</h2>

        <div className={styles.featGrid}>
          {ITEMS.map(({ key, icon: Icon }) => (
            <article key={key} className={styles.featCard}>
              <span className={styles.cardIcon} aria-hidden>
                <Icon size={22} stroke={1.6} />
              </span>
              <h3 className={styles.cardTitle}>{t(`landing.highlights.${key}.title`)}</h3>
              <p className={styles.cardBody}>{t(`landing.highlights.${key}.body`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
