-- One inbox notification per achievement unlock (dedupe concurrent evaluates).

-- Drop duplicate achievement notifications (keep earliest per user + key).
DELETE FROM public.notifications
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, payload->>'achievementKey'
             ORDER BY created_at ASC, id ASC
           ) AS rn
    FROM public.notifications
    WHERE type = 'achievement'
      AND payload->>'achievementKey' IS NOT NULL
  ) ranked
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_achievement_key_uidx
  ON public.notifications (user_id, ((payload->>'achievementKey')))
  WHERE type = 'achievement'
    AND payload->>'achievementKey' IS NOT NULL;
