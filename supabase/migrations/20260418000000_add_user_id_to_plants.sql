-- Phase 2: Multi-tenant schema changes
-- 1. Add user_id to plants (backfill existing rows, then drop default)
-- 2. Create notification_settings table

-- ============================================================
-- 1. plants.user_id
-- ============================================================

ALTER TABLE public.plants
  ADD COLUMN "user_id" uuid NOT NULL
    DEFAULT '0a1c8ed9-f21d-44cf-9b82-7b8dc0d97f35'::uuid
    REFERENCES auth.users(id);

-- Backfill is automatic via the DEFAULT above for existing rows.
-- Drop the default so future inserts must supply user_id explicitly.
ALTER TABLE public.plants
  ALTER COLUMN "user_id" DROP DEFAULT;

-- ============================================================
-- 2. notification_settings
-- ============================================================

CREATE TABLE public.notification_settings (
  "id"               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id"          uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  "telegram_chat_id" text NOT NULL,
  "createdAt"        timestamptz NOT NULL DEFAULT now(),
  "updatedAt"        timestamptz NOT NULL DEFAULT now()
);
