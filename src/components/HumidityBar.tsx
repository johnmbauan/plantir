import React from "react";
import { useTranslation } from "react-i18next";

interface HumidityBarProps {
  humidityPercent: number | null;
  threshold: number | null;
  barColor: string;
  animationDelay?: string;
  style?: React.CSSProperties;
}

export default function HumidityBar({ humidityPercent, threshold, barColor, animationDelay, style }: HumidityBarProps) {
  const { t } = useTranslation();

  return (
    <div style={{ paddingTop: 22, position: "relative", ...style }}>
      <div style={{ background: "var(--green-100)", borderRadius: 99, height: 12, position: "relative", overflow: "visible" }}>
        <div style={{
          width: `${humidityPercent ?? 0}%`,
          background: barColor,
          height: "100%",
          borderRadius: 99,
          ...(animationDelay != null ? { animationDelay } : {}),
        }} />
        {threshold != null && (
          <div style={{
            position: "absolute",
            top: -4, bottom: -4,
            left: `${threshold}%`,
            width: 2,
            borderRadius: 1,
            background: "var(--green-700)",
            transform: "translateX(-50%)",
          }}>
            <span style={{
              position: "absolute",
              top: -18,
              transform: "translateX(-50%)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--green-700)",
              whiteSpace: "nowrap",
            }}>
              {t("humidityBar.minThreshold", { threshold })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
