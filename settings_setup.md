# Krishna Library Settings, Gallery, and Achievers Setup SQL

Please copy the SQL block below, paste it into the **Supabase SQL Editor**, and click **Run**. This sets up the backend table storage, Row Level Security (RLS) policies, and Realtime sync for dynamic configuration.

```sql
-- ═══════════════════════════════════════════════════════════
-- 1. LIBRARY SETTINGS KEY-VALUE TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.library_settings (
  id          TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-populate default configurations
INSERT INTO public.library_settings (id, value, description) VALUES
('lib_name', 'Krishna Library', 'Name of the library'),
('lib_phone', '+91 8269144748', 'Contact phone number'),
('lib_address', 'Plot 12, Bangali Chowk Area, Ambikapur, C.G.', 'Invoice billing address'),
('upi_id', 'krishnalibrary@okaxis', 'Merchant UPI ID for scanned invoice collections'),
('upi_name', 'Krishna Library', 'Merchant display name for scanned invoice collections'),
('welcome_msg', 'Dear {name},\n\nWelcome to Krishna Library! Your admission is confirmed.\nBranch: {branch}\nSeat No: {seat}\nShift: {shift}\nValid Till: {expiry}\n\nHappy Learning!\nKrishna Library', 'WhatsApp template sent on new admission'),
('invoice_msg', 'Dear {name},\n\nYour invoice of {amount} has been generated. Due date: {due_date}.\n\nThank you for choosing Krishna Library.', 'WhatsApp template sent on invoice generation'),
('seat_assigned_msg', 'Dear {name},\n\nYou have been assigned Seat No. {seat_no} for the {shift} shift at our {branch} branch.', 'WhatsApp template sent on seat assignment'),
('due_soon_msg', 'Dear {name},\n\nThis is a friendly reminder that your Krishna Library subscription expires in 3 days on {expiry}.\n\nPlease renew to secure your seat (#{seat}).\n\nRegards,\nKrishna Library', 'WhatsApp template sent 3 days before expiry'),
('overdue_msg', 'Dear {name},\n\nYour payment of {amount} is overdue since {due_date}. Please clear your dues immediately to avoid seat cancellation.\n\nRegards,\nKrishna Library', 'WhatsApp template sent for overdue payments')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

-- ═══════════════════════════════════════════════════════════
-- 2. DYNAMIC GALLERY PHOTOS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url        TEXT NOT NULL,
  title      TEXT,
  branch     TEXT NOT NULL CHECK (branch IN ('bengali-chowk', 'namnakala', 'all')) DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-populate sample photos
INSERT INTO public.gallery_photos (url, title, branch) VALUES
('/assets/gallery/study-1.jpg', 'Modern Study Cubicles', 'all'),
('/assets/gallery/study-2.jpg', 'Quiet Reading Room', 'all')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 3. DYNAMIC ACHIEVERS TESTIMONIALS TABLE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.achievers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  achievement TEXT NOT NULL,
  photo_url   TEXT,
  testimonial TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-populate default achievers
INSERT INTO public.achievers (name, achievement, photo_url, testimonial) VALUES
('Manish Dubey', 'UPSC CSE 2025 - AIR 42', '/assets/achievers/a1.png', 'Krishna Library provided the quiet, focused space I needed to clear my exams. The seating and internet were flawless.'),
('Karan Sharma', 'CA Finals 2024', '/assets/achievers/a2.png', 'Perfect amenities, reserve cabins, and standard silent environment. Highly recommended for CA aspirants.'),
('Priya Singh', 'CGPSC 2025 - Rank 5', '/assets/achievers/a3.png', 'The 24/7 power backup and comfortable seats helped me study for long hours without exhaustion.')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 4. PERMISSIONS, ROW LEVEL SECURITY (RLS) & REALTIME
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.library_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_photos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievers TO anon, authenticated;

CREATE POLICY "anon_all_settings" ON public.library_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_gallery" ON public.gallery_photos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_achievers" ON public.achievers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable Realtime publications for instant updates across user interfaces
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.library_settings;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_photos;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.achievers;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
```
