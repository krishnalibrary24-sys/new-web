-- ============================================================
--  KRISHNA LIBRARY — SUPABASE DATABASE SCHEMA
--  Project ID: avjklqjjmehkkbuzpayz
--  Paste this entire file into the Supabase SQL Editor and Run
-- ============================================================

-- Fix: ensure public schema exists and is on the search path
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
SET search_path TO public;

-- ============================================================
-- 1. MEMBERS TABLE
--    Central table — used by every dashboard page.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permanent_id          TEXT UNIQUE,                         -- e.g. #KL26B001
  full_name             TEXT NOT NULL,
  father_name           TEXT,
  dob                   DATE,
  gender                TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  mobile                TEXT NOT NULL,
  address               TEXT,
  branch                TEXT NOT NULL CHECK (branch IN ('bengali-chowk', 'namnakala')),
  seat_no               TEXT,                               -- NULL = unassigned
  shift                 TEXT NOT NULL CHECK (shift IN ('Full Day', 'Morning', 'Evening')),
  plan_amount           INTEGER NOT NULL DEFAULT 1000,      -- 1000 full, 600 half
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  subscription_end_date TIMESTAMPTZ,
  pay_later             BOOLEAN NOT NULL DEFAULT FALSE,
  payment_due_date      DATE,
  left_with_dues        BOOLEAN NOT NULL DEFAULT FALSE,
  loss_amount           INTEGER NOT NULL DEFAULT 0,
  left_at               TIMESTAMPTZ,
  left_reason           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS members_set_updated_at ON public.members;
CREATE TRIGGER members_set_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_members_branch        ON public.members (branch);
CREATE INDEX IF NOT EXISTS idx_members_is_active     ON public.members (is_active);
CREATE INDEX IF NOT EXISTS idx_members_mobile        ON public.members (mobile);
CREATE INDEX IF NOT EXISTS idx_members_permanent_id  ON public.members (permanent_id);
CREATE INDEX IF NOT EXISTS idx_members_sub_end       ON public.members (subscription_end_date);


-- ============================================================
-- 2. PAYMENTS TABLE
--    Tracks every renewal / payment transaction.
--    Used in: members/page.tsx (handleRenew), invoices/page.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,
  branch       TEXT NOT NULL CHECK (branch IN ('bengali-chowk', 'namnakala')),
  payment_mode TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Online')),
  paid_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments (member_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch    ON public.payments (branch);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at   ON public.payments (paid_at DESC);


-- ============================================================
-- 3. LEADS TABLE (Enquiries)
--    Used in: enquiries/page.tsx
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  TEXT NOT NULL,
  phone      TEXT NOT NULL,
  interest   TEXT NOT NULL DEFAULT 'Full Day' CHECK (interest IN ('Full Day', 'Morning', 'Evening', 'Night Shift')),
  branch     TEXT CHECK (branch IN ('bengali-chowk', 'namnakala')),
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON public.leads (status);


-- ============================================================
-- 4. EXPENSES TABLE
--    Tracks all library expenditures
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch       TEXT NOT NULL CHECK (branch IN ('bengali-chowk', 'namnakala')),
  category     TEXT NOT NULL,
  amount       INTEGER NOT NULL,
  description  TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_branch ON public.expenses (branch);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (expense_date DESC);


-- ============================================================
-- 5. PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Grant direct table access to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses     TO anon, authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow full anon access to members"  ON public.members;
DROP POLICY IF EXISTS "Allow full anon access to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow full anon access to leads"    ON public.leads;
DROP POLICY IF EXISTS "Allow full anon access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "anon_all_members"  ON public.members;
DROP POLICY IF EXISTS "anon_all_payments" ON public.payments;
DROP POLICY IF EXISTS "anon_all_leads"    ON public.leads;
DROP POLICY IF EXISTS "anon_all_expenses" ON public.expenses;

-- Create new policies
CREATE POLICY "anon_all_members"
  ON public.members FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_payments"
  ON public.payments FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_leads"
  ON public.leads FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_expenses"
  ON public.expenses FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Grant sequence access (needed for inserts with serial/uuid)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


-- ============================================================
-- 6. ENABLE REALTIME PUBLICATIONS
-- ============================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication note: %', SQLERRM;
END $$;


-- ============================================================
-- 7. SEED DATA
-- ============================================================

-- Bengali Chowk members
INSERT INTO public.members (permanent_id, full_name, father_name, dob, gender, mobile, address, branch, seat_no, shift, plan_amount, is_active, subscription_end_date)
VALUES
  ('#KL26B001', 'Rahul Sharma',     'Suresh Sharma',   '2002-04-15', 'Male',   '9876543210', '12 Gandhi Nagar, Allahabad', 'bengali-chowk', '1',  'Full Day', 1000, TRUE,  NOW() + INTERVAL '25 days'),
  ('#KL26B002', 'Priya Verma',      'Vijay Verma',     '2001-09-22', 'Female', '9876543211', '45 Civil Lines, Prayagraj',  'bengali-chowk', '2',  'Morning',  600,  TRUE,  NOW() + INTERVAL '12 days'),
  ('#KL26B003', 'Amit Kumar',       'Rajesh Kumar',    '2003-01-08', 'Male',   '9876543212', '7 MG Road, Allahabad',       'bengali-chowk', '3',  'Evening',  600,  TRUE,  NOW() + INTERVAL '2 days'),
  ('#KL26B004', 'Sneha Gupta',      'Prakash Gupta',   '2002-11-30', 'Female', '9876543213', '23 Allengunj, Prayagraj',    'bengali-chowk', '4',  'Full Day', 1000, TRUE,  NOW() + INTERVAL '18 days'),
  ('#KL26B005', 'Vikram Singh',     'Hariom Singh',    '2000-06-17', 'Male',   '9876543214', '88 Colonelganj, Allahabad',  'bengali-chowk', '5',  'Morning',  600,  TRUE,  NOW() + INTERVAL '1 day'),
  ('#KL26B006', 'Ritu Mishra',      'Shyam Mishra',    '2004-03-25', 'Female', '9876543215', '34 Jhunsi, Prayagraj',       'bengali-chowk', NULL, 'Full Day', 1000, FALSE, NOW() - INTERVAL '5 days'),
  ('#KL26B007', 'Deepak Tiwari',    'Ramesh Tiwari',   '2001-07-14', 'Male',   '9876543216', '56 Naini, Allahabad',        'bengali-chowk', NULL, 'Evening',  600,  FALSE, NOW() - INTERVAL '10 days'),
  ('#KL26B008', 'Anjali Yadav',     'Sunil Yadav',     '2003-12-03', 'Female', '9876543217', '19 Lukerganj, Prayagraj',    'bengali-chowk', '8',  'Full Day', 1000, TRUE,  NOW() + INTERVAL '30 days'),
  ('#KL26B009', 'Rohit Pandey',     'Dinesh Pandey',   '2002-08-20', 'Male',   '9876543218', '67 Mumfordganj, Allahabad',  'bengali-chowk', '9',  'Morning',  600,  TRUE,  NOW() + INTERVAL '22 days'),
  ('#KL26B010', 'Kavya Srivastava', 'Anil Srivastava', '2001-05-11', 'Female', '9876543219', '11 Katra, Prayagraj',        'bengali-chowk', '10', 'Evening',  600,  TRUE,  NOW() + INTERVAL '15 days')
ON CONFLICT (permanent_id) DO NOTHING;

-- Namnakala members
INSERT INTO public.members (permanent_id, full_name, father_name, dob, gender, mobile, address, branch, seat_no, shift, plan_amount, is_active, subscription_end_date)
VALUES
  ('#KL26N001', 'Arun Patel',    'Mahesh Patel',    '2002-02-28', 'Male',   '9812345678', '45 Namnakala Road, Prayagraj', 'namnakala', '1',  'Full Day', 1000, TRUE,  NOW() + INTERVAL '20 days'),
  ('#KL26N002', 'Sunita Devi',   'Ramkumar',        '2001-10-15', 'Female', '9812345679', '78 Naini Sector 5, Allahabad', 'namnakala', '2',  'Morning',  600,  TRUE,  NOW() + INTERVAL '8 days'),
  ('#KL26N003', 'Sanjay Chauhan','Lakshman Chauhan','2003-06-09', 'Male',   '9812345680', '12 Phaphamau, Prayagraj',      'namnakala', '3',  'Full Day', 1000, TRUE,  NOW() + INTERVAL '3 days'),
  ('#KL26N004', 'Pooja Joshi',   'Govind Joshi',    '2002-04-22', 'Female', '9812345681', '29 Soraon, Allahabad',         'namnakala', NULL, 'Evening',  600,  FALSE, NOW() - INTERVAL '7 days'),
  ('#KL26N005', 'Manish Dubey',  'Vinod Dubey',     '2000-11-05', 'Male',   '9812345682', '55 Phulpur, Prayagraj',        'namnakala', '5',  'Morning',  600,  TRUE,  NOW() + INTERVAL '28 days')
ON CONFLICT (permanent_id) DO NOTHING;

-- Payment history
INSERT INTO public.payments (member_id, amount, branch, payment_mode, paid_at)
SELECT m.id, m.plan_amount, m.branch, 'Cash', NOW() - INTERVAL '30 days'
FROM public.members m
WHERE m.permanent_id IN ('#KL26B001','#KL26B002','#KL26B004','#KL26N001','#KL26N002');

INSERT INTO public.payments (member_id, amount, branch, payment_mode, paid_at)
SELECT m.id, m.plan_amount, m.branch, 'UPI', NOW()
FROM public.members m
WHERE m.permanent_id IN ('#KL26B001','#KL26B009','#KL26N003');

-- Enquiry leads
INSERT INTO public.leads (full_name, phone, interest, status)
VALUES
  ('Karan Mehta',   '9900112233', 'Full Day', 'new'),
  ('Divya Shukla',  '9900112234', 'Morning',  'contacted'),
  ('Arjun Nair',    '9900112235', 'Evening',  'new'),
  ('Neha Agarwal',  '9900112236', 'Full Day', 'converted'),
  ('Tushar Bhatt',  '9900112237', 'Morning',  'new')
ON CONFLICT DO NOTHING;


-- Verify: this should return rows if seed data was inserted
SELECT 'members' AS tbl, COUNT(*) AS rows FROM public.members
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'leads',    COUNT(*) FROM public.leads
UNION ALL
SELECT 'expenses', COUNT(*) FROM public.expenses;

-- ============================================================
-- AUTO-EXPIRE MEMBERS DAILY (Optional - requires pg_cron)
-- Enable pg_cron: Database > Extensions > pg_cron
-- Then uncomment and run:
-- ============================================================
/*
SELECT cron.schedule(
  'expire-members-daily',
  '0 0 * * *',
  $$
    UPDATE public.members
    SET is_active = FALSE
    WHERE is_active = TRUE
      AND subscription_end_date < NOW();
  $$
);
*/
