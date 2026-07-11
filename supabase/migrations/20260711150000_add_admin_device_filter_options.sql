-- Lightweight distinct values for admin filter dropdowns (no measurement joins).

CREATE OR REPLACE FUNCTION public.get_admin_device_filter_options()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT jsonb_build_object(
    'serials', COALESCE((
      SELECT jsonb_agg("serialNumber" ORDER BY "serialNumber")
      FROM (SELECT DISTINCT d."serialNumber" FROM public.devices d) s
    ), '[]'::jsonb),
    'owners', COALESCE((
      SELECT jsonb_agg(email ORDER BY email)
      FROM (
        SELECT DISTINCT u.email::text AS email
        FROM public.devices d
        JOIN auth.users u ON u.id = d.user_id
      ) o
    ), '[]'::jsonb),
    'plants', COALESCE((
      SELECT jsonb_agg(name ORDER BY name)
      FROM (
        SELECT DISTINCT p.name
        FROM public.devices d
        JOIN public.plants p ON p.id = d."plantId"
      ) pl
    ), '[]'::jsonb),
    'has_unassigned_owner', EXISTS (
      SELECT 1
      FROM public.devices d
      LEFT JOIN auth.users u ON u.id = d.user_id
      WHERE u.email IS NULL
    ),
    'has_unassigned_plant', EXISTS (
      SELECT 1
      FROM public.devices d
      LEFT JOIN public.plants p ON p.id = d."plantId"
      WHERE p.name IS NULL
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_device_filter_options() TO authenticated;
