import { useTranslation } from "react-i18next";
import HumidityBar from "@/components/HumidityBar";
import FilterChip from "@/components/shared/FilterChip";
import IconLeaf from "@/components/icons/IconLeaf";
import IconDrop from "@/components/icons/IconDrop";
import styles from "./LandingPage.module.css";

export default function LandingGlimpse() {
  const { t } = useTranslation();

  return (
    <div className={styles.glimpse} aria-label={t("landing.glimpse.aria")}>
      <div className={styles.glimpseList}>
        <article className={styles.glimpseRow}>
          <div className={styles.glimpseAvatar} aria-hidden>
            <IconLeaf size={22} />
          </div>
          <div className={styles.glimpseInfo}>
            <div className={styles.glimpseNameRow}>
              <span className={styles.glimpseName}>{t("landing.glimpse.plants.ficus")}</span>
              <FilterChip icon={<IconLeaf size={13} />} label={t("plantStatus.healthy")} variant="healthy" />
            </div>
            <HumidityBar humidityPercent={62} threshold={35} barColor="var(--green-400)" />
          </div>
        </article>

        <article className={styles.glimpseRow}>
          <div className={styles.glimpseAvatar} aria-hidden>
            <IconDrop size={22} />
          </div>
          <div className={styles.glimpseInfo}>
            <div className={styles.glimpseNameRow}>
              <span className={styles.glimpseName}>{t("landing.glimpse.plants.basil")}</span>
              <FilterChip
                icon={<IconDrop size={13} />}
                label={t("plantStatus.needsWater")}
                variant="watering"
              />
            </div>
            <HumidityBar humidityPercent={18} threshold={30} barColor="var(--terracotta-500)" />
          </div>
        </article>
      </div>
    </div>
  );
}
