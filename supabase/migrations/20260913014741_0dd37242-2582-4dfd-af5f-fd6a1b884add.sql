ALTER TABLE public.client_milestones
  ADD COLUMN IF NOT EXISTS stage_type text NOT NULL DEFAULT 'build'
  CONSTRAINT client_milestones_stage_type_check CHECK (stage_type IN ('design', 'build'));

CREATE TABLE public.project_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES public.client_milestones(id) ON DELETE CASCADE,
  stage_type text NOT NULL DEFAULT 'build' CHECK (stage_type IN ('design', 'build')),
  status text NOT NULL DEFAULT 'awaiting_review' CHECK (status IN ('awaiting_review', 'approved', 'changes_requested', 'superseded')),
  review_url text,
  review_note text,
  client_feedback text,
  decided_by_user_id uuid,
  decided_by_email text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  client_notified_at timestamptz,
  owner_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.project_approvals TO authenticated;
GRANT ALL ON public.project_approvals TO service_role;

ALTER TABLE public.project_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view approvals for their projects"
ON public.project_approvals FOR SELECT TO authenticated
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

CREATE POLICY "Admins manage project approvals"
ON public.project_approvals FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX project_approvals_project_idx ON public.project_approvals(project_id, requested_at DESC);
CREATE INDEX project_approvals_milestone_idx ON public.project_approvals(milestone_id, requested_at DESC);
CREATE UNIQUE INDEX project_approvals_one_open_per_milestone_idx
  ON public.project_approvals(milestone_id)
  WHERE status = 'awaiting_review';

CREATE TRIGGER update_project_approvals_updated_at
BEFORE UPDATE ON public.project_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();