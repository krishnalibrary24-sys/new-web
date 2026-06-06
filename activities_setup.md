# Activities Log Database Setup

Please copy the SQL queries below and execute them in your Supabase SQL Editor to initialize the `activity_logs` table.

## SQL Script to Execute

```sql
-- ============================================================
-- 9. ACTIVITY LOGS TABLE
--    Tracks all operations (inserts, updates, deletes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch      TEXT NOT NULL CHECK (branch IN ('bengali-chowk', 'namnakala')),
  staff_id    TEXT NOT NULL,
  action_type TEXT NOT NULL,
  details     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast search and filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_branch ON public.activity_logs (branch);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Grant Direct Access Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO anon, authenticated;

-- Create Public Access Policy
DROP POLICY IF EXISTS "anon_all_activity_logs" ON public.activity_logs;
CREATE POLICY "anon_all_activity_logs"
  ON public.activity_logs FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Enable Realtime Syncing
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication note: %', SQLERRM;
END $$;
```

Once you run this query, refresh the Activities page on the dashboard and it will load and sync all data logs dynamically.
