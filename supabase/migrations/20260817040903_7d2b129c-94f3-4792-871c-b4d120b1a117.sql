CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  project_type text,
  message text not null,
  status text not null default 'unread',
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_inquiries TO authenticated;
GRANT ALL ON public.contact_inquiries TO service_role;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inquiries" ON public.contact_inquiries FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.showcase_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tagline text,
  description text not null,
  url text,
  category text,
  metric text,
  tags text[] not null default '{}',
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.showcase_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.showcase_projects TO authenticated;
GRANT ALL ON public.showcase_projects TO service_role;
ALTER TABLE public.showcase_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published projects" ON public.showcase_projects FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "Admins manage projects" ON public.showcase_projects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.project_proposals (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid,
  share_token text not null unique,
  client_name text not null,
  client_email text not null,
  client_company text,
  project_title text not null,
  scope_deliverables text not null,
  timeline_weeks text not null default '2-3 Weeks',
  total_price_cents integer not null default 0,
  deposit_cents integer not null default 0,
  balance_cents integer not null default 0,
  terms text not null default '',
  status text not null default 'draft',
  client_signed_at timestamptz,
  client_signature_name text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_proposals TO authenticated;
GRANT ALL ON public.project_proposals TO service_role;
ALTER TABLE public.project_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage proposals" ON public.project_proposals FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.project_briefs
  ADD COLUMN IF NOT EXISTS project_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS project_notes text,
  ADD COLUMN IF NOT EXISTS project_links text;