CREATE TABLE public.project_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  project_type TEXT NOT NULL,
  goals TEXT NOT NULL,
  audience TEXT,
  deliverables TEXT,
  references_links TEXT,
  budget TEXT,
  timeline TEXT,
  extra TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.project_briefs TO service_role;
ALTER TABLE public.project_briefs ENABLE ROW LEVEL SECURITY;
CREATE INDEX project_briefs_session_idx ON public.project_briefs (stripe_session_id);