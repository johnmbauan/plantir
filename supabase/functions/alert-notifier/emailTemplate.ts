import type { Locale } from "./i18n.ts";
import {
  alertText,
  emailSubject,
  formatLastSeen,
} from "./i18n.ts";

export interface EmailWateringPlant {
  plantName: string;
  humidity: number;
  rainNote: string;
}

export interface EmailOfflinePlant {
  plantName: string;
  lastSeenAt: string | null;
}

export interface DigestEmailInput {
  locale: Locale;
  timezone: string;
  appOrigin: string;
  watering: EmailWateringPlant[];
  offline: EmailOfflinePlant[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemSep(locale: Locale): string {
  return locale === "it" ? ": " : " — ";
}

function wateringLine(locale: Locale, plant: EmailWateringPlant): string {
  const humidity = alertText(locale, "wateringBody", { humidity: plant.humidity });
  if (!plant.rainNote) return humidity;
  return locale === "it" ? `${humidity}. ${plant.rainNote}` : `${humidity} — ${plant.rainNote}`;
}

export function buildDigestEmail(input: DigestEmailInput): { subject: string; html: string; text: string } {
  const { locale, timezone, appOrigin, watering, offline } = input;
  const subject = emailSubject(
    locale,
    watering.map((p) => p.plantName),
    offline.map((p) => p.plantName),
  );
  const dashboardUrl = `${appOrigin}/dashboard`;
  const settingsUrl = `${appOrigin}/settings`;
  const logoUrl = `${appOrigin}/logo.png`;

  const wateringText = watering.length === 0
    ? ""
    : [
      alertText(locale, "emailWateringHeading"),
      ...watering.map((p) => `• ${p.plantName}${itemSep(locale)}${wateringLine(locale, p)}`),
    ].join("\n");

  const offlineText = offline.length === 0
    ? ""
    : [
      alertText(locale, "emailOfflineHeading"),
      ...offline.map((p) => `• ${p.plantName} (${formatLastSeen(locale, p.lastSeenAt, timezone)})`),
    ].join("\n");

  const text = [
    alertText(locale, "emailGreeting"),
    "",
    alertText(locale, "emailIntro"),
    "",
    wateringText || null,
    wateringText && offlineText ? "" : null,
    offlineText || null,
    "",
    `${alertText(locale, "emailOpenDashboard")}: ${dashboardUrl}`,
    `${alertText(locale, "emailManagePrefs")}: ${settingsUrl}`,
    "",
    alertText(locale, "emailTagline"),
  ].filter((line) => line !== null).join("\n");

  const wateringHtml = watering.length === 0
    ? ""
    : `
          <tr>
            <td style="padding: 16px 32px 0 32px;">
              <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #2d5241;">
                ${escapeHtml(alertText(locale, "emailWateringHeading"))}
              </p>
              <ul style="margin: 0; padding: 0 0 0 18px; color: #1a2e22; font-size: 15px; line-height: 1.6;">
                ${watering.map((p) => `
                <li style="margin: 0 0 6px 0;">
                  <strong style="color: #2d5241;">${escapeHtml(p.plantName)}</strong>
                  ${locale === "it" ? ":" : "—"} ${escapeHtml(wateringLine(locale, p))}
                </li>`).join("")}
              </ul>
            </td>
          </tr>`;

  const offlineHtml = offline.length === 0
    ? ""
    : `
          <tr>
            <td style="padding: 16px 32px 0 32px;">
              <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #2d5241;">
                ${escapeHtml(alertText(locale, "emailOfflineHeading"))}
              </p>
              <ul style="margin: 0; padding: 0 0 0 18px; color: #1a2e22; font-size: 15px; line-height: 1.6;">
                ${offline.map((p) => `
                <li style="margin: 0 0 6px 0;">
                  <strong style="color: #2d5241;">${escapeHtml(p.plantName)}</strong>
                  (${escapeHtml(formatLastSeen(locale, p.lastSeenAt, timezone))})
                </li>`).join("")}
              </ul>
            </td>
          </tr>`;

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #faf2ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a2e22; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf2ee;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 420px; background-color: #ffffff; border: 1px solid #f4e1d9; border-radius: 12px; box-shadow: 0 1px 3px rgba(74, 43, 28, 0.06);">
          <tr>
            <td style="padding: 32px 32px 8px 32px; text-align: center;">
              <img src="${escapeHtml(logoUrl)}" width="48" height="50" alt="" style="display: block; margin: 0 auto 12px auto;" />
              <p style="margin: 0; font-size: 24px; font-weight: 700; color: #2d5241; letter-spacing: -0.3px; line-height: 1.3;">
                Plantir
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 32px 0 32px;">
              <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 1.6; color: #1a2e22;">
                ${escapeHtml(alertText(locale, "emailGreeting"))}
              </p>
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1a2e22;">
                ${escapeHtml(alertText(locale, "emailIntro"))}
              </p>
            </td>
          </tr>
          ${wateringHtml}
          ${offlineHtml}
          <tr>
            <td style="padding: 24px 32px 0 32px; text-align: center;">
              <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; background-color: #4a7c59; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 8px; line-height: 1.2;">
                ${escapeHtml(alertText(locale, "emailOpenDashboard"))}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 32px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6fa080;">
                <a href="${escapeHtml(settingsUrl)}" style="color: #4a7c59;">${escapeHtml(alertText(locale, "emailManagePrefs"))}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #6fa080; text-align: center;">
          ${escapeHtml(alertText(locale, "emailTagline"))}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
