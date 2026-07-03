-- Pairing tokens for multitenant device registration via Edge Functions.

CREATE TABLE IF NOT EXISTS public.device_pairing_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id bigint REFERENCES public.plants(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  registered_serial_number text,
  registered_device_id bigint REFERENCES public.devices(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS device_pairing_tokens_user_created_idx
  ON public.device_pairing_tokens (user_id, created_at DESC);

ALTER TABLE public.device_pairing_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read own pairing tokens"
  ON public.device_pairing_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Prevent duplicate hardware registration across tenants.
ALTER TABLE public.devices
  ADD CONSTRAINT devices_serial_number_unique UNIQUE ("serialNumber");
