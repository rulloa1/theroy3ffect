-- Migration: Studio Dashboard - Contact Inquiries, Showcase Projects & Milestone Tracking

-- 1. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  project_type TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'replied', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on contact_inquiries
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public anyone to insert contact inquiries
CREATE POLICY "Public can submit contact inquiries"
ON public.contact_inquiries FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow admins full access to contact inquiries
CREATE POLICY "Admins have full access to contact inquiries"
ON public.contact_inquiries FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Showcase Projects Table
CREATE TABLE IF NOT EXISTS public.showcase_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Brand Identity' CHECK (category IN ('Brand Identity', 'UI/UX', 'No-Code')),
  metric TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on showcase_projects
ALTER TABLE public.showcase_projects ENABLE ROW LEVEL SECURITY;

-- Public can read published showcase projects
CREATE POLICY "Public can view published showcase projects"
ON public.showcase_projects FOR SELECT TO anon, authenticated
USING (is_published = true);

-- Admins have full access to showcase projects
CREATE POLICY "Admins have full access to showcase projects"
ON public.showcase_projects FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Add project milestone tracking columns to project_briefs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_briefs' AND column_name = 'project_status'
  ) THEN
    ALTER TABLE public.project_briefs ADD COLUMN project_status TEXT NOT NULL DEFAULT 'brief_received'
      CHECK (project_status IN ('brief_received', 'direction_locked', 'design_build', 'in_review', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_briefs' AND column_name = 'project_notes'
  ) THEN
    ALTER TABLE public.project_briefs ADD COLUMN project_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_briefs' AND column_name = 'project_links'
  ) THEN
    ALTER TABLE public.project_briefs ADD COLUMN project_links TEXT;
  END IF;
END $$;
