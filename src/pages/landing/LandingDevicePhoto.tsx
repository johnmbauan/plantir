import { useTranslation } from "react-i18next";
import styles from "./LandingGarden.module.css";

const SENSOR_PHOTO = "/landing/sensor.jpg";

export default function LandingDevicePhoto() {
  const { t } = useTranslation();

  return (
    <figure className={styles.photoWrap}>
      <img
        className={styles.photo}
        src={SENSOR_PHOTO}
        alt={t("landing.photo.alt")}
        width={1200}
        height={800}
      />
      <p className={styles.notify} aria-hidden>
        {t("landing.photo.notify")}
      </p>
    </figure>
  );
}
