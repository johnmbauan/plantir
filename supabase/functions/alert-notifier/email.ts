import type { PoolClient } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import type { OfflineDigestItem, WateringDigestItem } from "./types.ts";
import { resolveLocale } from "./i18n.ts";
import { buildDigestEmail } from "./emailTemplate.ts";
import { sendResendEmail } from "./resend.ts";

export interface EmailDigestResult {
  sent: number;
  skipped: number;
}

interface DigestUser {
  userId: string;
  email: string;
  locale: string;
  timezone: string;
  watering: WateringDigestItem[];
  offline: OfflineDigestItem[];
}

function groupByUser(
  wateringItems: WateringDigestItem[],
  offlineItems: OfflineDigestItem[],
): DigestUser[] {
  const byUser = new Map<string, DigestUser>();

  function ensure(item: { userId: string; email: string; locale: string; notificationTimezone: string }) {
    let user = byUser.get(item.userId);
    if (!user) {
      user = {
        userId: item.userId,
        email: item.email,
        locale: item.locale,
        timezone: item.notificationTimezone,
        watering: [],
        offline: [],
      };
      byUser.set(item.userId, user);
    }
    return user;
  }

  for (const item of wateringItems) {
    ensure(item).watering.push(item);
  }
  for (const item of offlineItems) {
    ensure(item).offline.push(item);
  }

  return [...byUser.values()];
}

async function claimSendSlot(
  connection: PoolClient,
  userId: string,
  timezone: string,
): Promise<boolean> {
  const { rows } = await connection.queryObject<{ userId: string }>(
    `INSERT INTO notification_email_log (user_id, local_date)
     VALUES ($1::uuid, (NOW() AT TIME ZONE $2)::date)
     ON CONFLICT (user_id, local_date) DO NOTHING
     RETURNING user_id AS "userId"`,
    [userId, timezone],
  );
  return rows.length > 0;
}

async function releaseSendSlot(
  connection: PoolClient,
  userId: string,
  timezone: string,
): Promise<void> {
  await connection.queryObject(
    `DELETE FROM notification_email_log
     WHERE user_id = $1::uuid
       AND local_date = (NOW() AT TIME ZONE $2)::date`,
    [userId, timezone],
  );
}

export async function sendEmailDigests(
  connection: PoolClient,
  wateringItems: WateringDigestItem[],
  offlineItems: OfflineDigestItem[],
  resendApiKey: string | undefined,
  from: string | undefined,
  appOrigin: string,
): Promise<EmailDigestResult> {
  if (!resendApiKey || !from) {
    if (wateringItems.length > 0 || offlineItems.length > 0) {
      console.warn("Skipping email digests: RESEND_API_KEY or RESEND_FROM is not set");
    }
    return { sent: 0, skipped: 0 };
  }

  const users = groupByUser(wateringItems, offlineItems);
  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.email || (user.watering.length === 0 && user.offline.length === 0)) {
      skipped += 1;
      continue;
    }

    const claimed = await claimSendSlot(connection, user.userId, user.timezone);
    if (!claimed) {
      skipped += 1;
      continue;
    }

    const locale = resolveLocale(user.locale);
    const { subject, html, text } = buildDigestEmail({
      locale,
      timezone: user.timezone,
      appOrigin,
      watering: user.watering,
      offline: user.offline,
    });

    try {
      await sendResendEmail(resendApiKey, {
        from,
        to: user.email,
        subject,
        html,
        text,
      });
      sent += 1;
    } catch (error) {
      console.error("Failed to send digest email:", error);
      await releaseSendSlot(connection, user.userId, user.timezone);
      skipped += 1;
    }
  }

  return { sent, skipped };
}
