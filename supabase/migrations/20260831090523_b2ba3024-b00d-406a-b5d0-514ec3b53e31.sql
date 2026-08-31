CREATE TABLE public.client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  client_email text NOT NULL,
  title text NOT NULL,
  summary text,
  status text NOT NULL DEFAULT 'onboarding',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.client_projects TO authenticated;
GRANT ALL ON public.client_projects TO service_role;

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view their own projects"
ON public.client_projects FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR lower(client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  OR private.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins manage client projects"
ON public.client_projects FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.client_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  note text,
  link text,
  status text NOT NULL DEFAULT 'pending',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.client_milestones TO authenticated;
GRANT ALL ON public.client_milestones TO service_role;

ALTER TABLE public.client_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view milestones of their projects"
ON public.client_milestones FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_projects p
    WHERE p.id = project_id
      AND (
        p.user_id = auth.uid()
        OR lower(p.client_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
  OR private.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins manage client milestones"
ON public.client_milestones FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));