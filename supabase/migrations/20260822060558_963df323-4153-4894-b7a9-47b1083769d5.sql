CREATE TABLE public.automation_jobs (
  job_key text PRIMARY KEY,
  status text NOT NULL DEFAULT 'active',
  paused_reason text,
  lease_owner text,
  lease_expires_at timestamptz,
  last_run_at timestamptz,
  last_error text,
  consecutive_failures integer NOT NULL DEFAULT 0,
  items_processed integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.automation_jobs TO authenticated;
GRANT ALL ON public.automation_jobs TO service_role;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage automation jobs" ON public.automation_jobs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.automation_jobs (job_key) VALUES ('followup_autopilot');

CREATE TABLE public.followup_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_key text NOT NULL UNIQUE,
  playbook text NOT NULL,
  lead_id uuid REFERENCES public.voice_leads(id) ON DELETE SET NULL,
  source_table text NOT NULL,
  source_id text NOT NULL,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  cta_label text,
  cta_url text,
  rationale text,
  model text,
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX followup_drafts_status_idx ON public.followup_drafts (status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followup_drafts TO authenticated;
GRANT ALL ON public.followup_drafts TO service_role;
ALTER TABLE public.followup_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage followup drafts" ON public.followup_drafts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_followup_drafts_updated_at BEFORE UPDATE ON public.followup_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();