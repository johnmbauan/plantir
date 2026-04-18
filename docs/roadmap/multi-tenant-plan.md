# Plan: Multi-Tenant Migration for Plantir

## Current State
- Zero authentication — anon Supabase key has unrestricted CRUD on all tables
- No user_id / owner_id on any table
- 4 tables: plants, devices, humidity_sensors_config, humidity_measurements
- Ownership chain: plants → devices → (humidity_sensors_config + humidity_measurements)
- All RLS policies are USING (true) — no access control
- Arduino devices insert measurements directly via PostgREST with the anon key
- Telegram notifier bypasses RLS via raw Postgres connection, hits all plants globally

## Scope: User-level multi-tenancy (confirmed, not org/team)
Each authenticated user owns their own plants, devices, and measurements.

## Phases

### Phase 1: Auth Plumbing
1. Wire up Supabase Auth in the frontend (supabase.ts already has the client)
2. Create LoginPage
3. Add auth state context to App.tsx (useSession / onAuthStateChange)
4. Add auth-guarded routes in the router (redirect unauthenticated to /login)

### Phase 2: Database Schema (new migration)
1. Add `user_id uuid NOT NULL REFERENCES auth.users(id)` to `plants` using temporary default `82a811aa-aac1-4128-9d2a-71cfc837b4b7` to backfill existing rows, then drop the default
2. No RLS changes — RLS is intentionally NOT used; isolation is enforced at the application layer
3. Create `notification_settings` table: `id`, `user_id uuid UNIQUE REFERENCES auth.users(id)`, `telegram_chat_id text`, `createdAt`, `updatedAt`

### Phase 3: Frontend Service Updates
1. plantService.createPlant: add user_id field (from `(await supabase.auth.getUser()).data.user.id`)
2. plantService.fetchPlants: add `.eq('user_id', userId)` filter — RLS no longer does this automatically
3. deviceService.fetchDevices: join through plants, filter by user_id (e.g. filter on plants.user_id or fetch plantIds first)
4. All write operations (update, delete): verify the target row belongs to the current user before executing, or rely on the user_id filter making the row invisible if it doesn't belong to them
5. notificationService.ts (new): fetchSettings() and upsertSettings(telegram_chat_id) scoped by user_id

### Phase 4: Telegram Notifier
1. create a user_settings table with a `telegram_chat_id` column; each user can define their own chat ID
2. Update WATERING_QUERY and OFFLINE_QUERY to join through plants → user_id → user settings
3. Send notifications per user to their configured chat_id

## Key Files to Modify
- supabase/migrations/ — new migration for user_id column + RLS policies
- src/supabase.ts — add auth session handling
- src/App.tsx — add auth state/context, protected routes
- src/services/plantService.ts — pass user_id on create
- supabase/functions/telegram-notifier/index.ts — scope per user
- New: src/pages/LoginPage.tsx, src/components/AuthGuard.tsx
