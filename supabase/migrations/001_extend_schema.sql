-- Participant Portal — extend schema, companies, RLS, profile trigger
-- Run via Supabase SQL editor or: supabase db push / migration apply

-- Extend profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Extend enrollments table
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS plan_data jsonb,
  ADD COLUMN IF NOT EXISTS contribution_data jsonb,
  ADD COLUMN IF NOT EXISTS source_data jsonb,
  ADD COLUMN IF NOT EXISTS auto_increase_data jsonb,
  ADD COLUMN IF NOT EXISTS investment_data jsonb,
  ADD COLUMN IF NOT EXISTS readiness_data jsonb,
  ADD COLUMN IF NOT EXISTS review_data jsonb,
  ADD COLUMN IF NOT EXISTS current_step integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS highest_completed_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create companies table (if missing)
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan_name text,
  employer_match_percent numeric(5, 2) DEFAULT 0,
  branding_json jsonb,
  logo_url text,
  primary_color text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_companies
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'participant';

-- Link user_companies → companies (skip if constraint already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_user_companies_company'
  ) THEN
    ALTER TABLE user_companies
      ADD CONSTRAINT fk_user_companies_company
      FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE;
  END IF;
END $$;

-- Seed companies (matches defaultBrands.ts)
INSERT INTO companies (name, slug, plan_name, employer_match_percent, primary_color)
VALUES
  ('Congruent Solutions', 'congruent', '401(k) Plan', 4.0, '#0052CC'),
  ('Lincoln Group', 'lincoln', '403(b) Plan', 3.5, '#6B1D4A'),
  ('John Hancock', 'john-hancock', '401(k) Plan', 5.0, '#002B5C'),
  ('Transamerica', 'transamerica', '401(k) Plan', 4.5, '#E31837'),
  ('Vanguard', 'vanguard', '401(k) Plan', 6.0, '#811926')
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Profiles: own rows only
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Enrollments: own rows only
DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
CREATE POLICY "enrollments_select_own" ON enrollments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_insert_own" ON enrollments;
CREATE POLICY "enrollments_insert_own" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_update_own" ON enrollments;
CREATE POLICY "enrollments_update_own" ON enrollments FOR UPDATE USING (auth.uid() = user_id);

-- user_companies: read own links
DROP POLICY IF EXISTS "user_companies_select_own" ON user_companies;
CREATE POLICY "user_companies_select_own" ON user_companies FOR SELECT USING (auth.uid() = user_id);

-- Companies: readable by anyone authenticated (anon read for marketing); use true for public catalog
DROP POLICY IF EXISTS "companies_public_read" ON companies;
CREATE POLICY "companies_public_read" ON companies FOR SELECT USING (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
