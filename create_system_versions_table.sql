CREATE TABLE IF NOT EXISTS public.system_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  system_type text NOT NULL CHECK (system_type IN ('back_office', 'website', 'app')),
  version_number text NOT NULL,
  release_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  new_features text,
  improved_features text,
  fixed_features text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_versions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users (or public depending on the setup)
CREATE POLICY "Allow all select" ON public.system_versions FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.system_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.system_versions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.system_versions FOR DELETE USING (true);

-- Optional: index for fast ordering
CREATE INDEX IF NOT EXISTS system_versions_release_date_idx ON public.system_versions (release_date DESC);
