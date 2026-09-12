CREATE TABLE public.onboarding_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_name TEXT,
  product_name TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  project_id UUID REFERENCES public.client_projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  rationale TEXT,
  model TEXT,
  welcome_email_sent_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX onboarding_runs_source_key ON public.onboarding_runs (source_table, source_id);
CREATE INDEX onboarding_runs_status_idx ON public.onboarding_runs (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_runs TO authenticated;
GRANT ALL ON public.onboarding_runs TO service_role;

ALTER TABLE public.onboarding_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage onboarding runs"
ON public.onboarding_runs
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_onboarding_runs_updated_at
BEFORE UPDATE ON public.onboarding_runs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();