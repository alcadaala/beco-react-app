-- 1. Fix the table structure by adding a UNIQUE constraint to the 'name' column
-- (This allows 'ON CONFLICT' to work)
BEGIN;

-- Optional: Remove duplicates if they exist, to allow adding the unique constraint
DELETE FROM public.branches a USING public.branches b WHERE a.id > b.id AND a.name = b.name;

-- Add the unique constraint if it doesn't exist
ALTER TABLE public.branches ADD CONSTRAINT branches_name_unique UNIQUE (name);

COMMIT;

-- 2. Now insert the branches safely
INSERT INTO public.branches (name)
VALUES 
  ('WSH'),
  ('DRS'),
  ('DKL'),
  ('MDN'),
  ('KPP')
ON CONFLICT (name) DO NOTHING;

-- 3. Ensure RLS allows reading (in case it was missed)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to branches" ON public.branches;

CREATE POLICY "Allow public read access to branches"
ON public.branches
FOR SELECT
TO anon, authenticated
USING (true);
