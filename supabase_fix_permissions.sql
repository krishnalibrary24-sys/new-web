-- ============================================================
--  KRISHNA LIBRARY — PERMISSIONS FIX
--  Run this in Supabase SQL Editor > New Query > Run
--  This fixes "permission denied for table members" (code 42501)
-- ============================================================

-- Step 1: Grant direct table access to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads        TO anon, authenticated;

-- Step 2: Grant usage on the public schema itself
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Step 3: Ensure RLS is enabled and policies exist
ALTER TABLE public.members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads    ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop any old policies and recreate clean ones
DROP POLICY IF EXISTS "Allow full anon access to members"  ON public.members;
DROP POLICY IF EXISTS "Allow full anon access to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow full anon access to leads"    ON public.leads;

CREATE POLICY "anon_all_members"
  ON public.members FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_payments"
  ON public.payments FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_leads"
  ON public.leads FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Step 5: Also grant sequence access (needed for inserts with serial/uuid)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify: this should return rows if seed data was inserted
SELECT 'members' AS tbl, COUNT(*) AS rows FROM public.members
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'leads',    COUNT(*) FROM public.leads;
