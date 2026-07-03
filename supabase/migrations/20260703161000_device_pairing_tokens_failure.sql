-- Track failure reason on pairing tokens so the wizard can show actionable errors.
ALTER TABLE public.device_pairing_tokens
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_reason text;
