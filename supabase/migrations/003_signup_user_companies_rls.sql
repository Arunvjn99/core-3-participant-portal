-- Fix signup: allow authenticated users to insert their own user_companies row,
-- and link company server-side from auth metadata (works when email confirmation
-- returns no session, so client-side inserts would fail RLS).

-- RLS: own-row insert (was missing — inserts were always denied)
DROP POLICY IF EXISTS "user_companies_insert_own" ON public.user_companies;
CREATE POLICY "user_companies_insert_own" ON public.user_companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Extend new-user trigger: profile + optional company link by slug from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slug text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      trim(
        concat_ws(
          ' ',
          nullif(trim(NEW.raw_user_meta_data->>'first_name'), ''),
          nullif(trim(NEW.raw_user_meta_data->>'last_name'), '')
        )
      ),
      ''
    )
  )
  ON CONFLICT (id) DO NOTHING;

  slug := nullif(trim(lower(NEW.raw_user_meta_data->>'company_slug')), '');
  IF slug IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.user_companies uc WHERE uc.user_id = NEW.id
  ) THEN
    INSERT INTO public.user_companies (user_id, company_id, role)
    SELECT NEW.id, c.id, 'participant'
    FROM public.companies c
    WHERE lower(c.slug) = slug
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

-- Postgres 15+ uses EXECUTE FUNCTION; older images accept PROCEDURE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
