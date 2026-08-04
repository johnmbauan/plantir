-- Partial index for garden-achievements badgeEligibility queries:
-- WHERE user_id = ? AND type = ? AND resolved_at IS NOT NULL
-- Existing notifications_user_unread_idx only covers unread/unresolved rows.

CREATE INDEX IF NOT EXISTS notifications_user_type_resolved_idx
  ON public.notifications (user_id, type)
  WHERE resolved_at IS NOT NULL;
