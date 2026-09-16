-- Run this once in Supabase Dashboard > SQL Editor.
-- Creates the projects table and admin access rules.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  live_url text,
  github_url text,
  technologies text[] DEFAULT '{}'::text[],
  key_features text[] DEFAULT '{}'::text[],
  image_url text,
  image_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_created_at
  ON public.projects(created_at);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read projects" ON public.projects;
CREATE POLICY "Allow public read projects"
  ON public.projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage projects" ON public.projects;
CREATE POLICY "Admin can manage projects"
  ON public.projects FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'dayalprashant766@gmail.com');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
