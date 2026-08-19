CREATE TABLE public.voice_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company_name text,
  email text,
  phone text,
  website_url text,
  project_type text NOT NULL DEFAULT 'not_sure',
  primary_goal text,
  target_audience text,
  timeline text,
  budget_range text,
  notes text,
  consent_to_follow_up boolean NOT NULL DEFAULT false,
  stage text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'vapi_inbound_call',
  vapi_call_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_leads TO authenticated;
GRANT ALL ON public.voice_leads TO service_role;
ALTER TABLE public.voice_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage voice leads" ON public.voice_leads FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.voice_audit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.voice_leads(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  website_url text NOT NULL,
  primary_bottleneck text,
  consent_to_email boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'audit_in_progress',
  vapi_call_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_audit_requests TO authenticated;
GRANT ALL ON public.voice_audit_requests TO service_role;
ALTER TABLE public.voice_audit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage voice audit requests" ON public.voice_audit_requests FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.voice_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.voice_leads(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  slot_start timestamptz NOT NULL,
  slot_end timestamptz NOT NULL,
  time_zone text NOT NULL DEFAULT 'America/Chicago',
  meeting_reference text,
  status text NOT NULL DEFAULT 'scheduled',
  vapi_call_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, slot_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_bookings TO authenticated;
GRANT ALL ON public.voice_bookings TO service_role;
ALTER TABLE public.voice_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage voice bookings" ON public.voice_bookings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.voice_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.voice_leads(id) ON DELETE SET NULL,
  full_name text,
  email text,
  phone text,
  reason text NOT NULL,
  urgency text NOT NULL DEFAULT 'normal',
  summary text NOT NULL,
  preferred_method text,
  status text NOT NULL DEFAULT 'open',
  vapi_call_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_followups TO authenticated;
GRANT ALL ON public.voice_followups TO service_role;
ALTER TABLE public.voice_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage voice followups" ON public.voice_followups FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.voice_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id text,
  tool_name text NOT NULL,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ok boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.voice_agent_logs TO authenticated;
GRANT ALL ON public.voice_agent_logs TO service_role;
ALTER TABLE public.voice_agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read voice agent logs" ON public.voice_agent_logs FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX voice_leads_email_idx ON public.voice_leads (lower(email));
CREATE INDEX voice_agent_logs_call_idx ON public.voice_agent_logs (vapi_call_id);

CREATE TRIGGER update_voice_leads_updated_at BEFORE UPDATE ON public.voice_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_voice_audit_requests_updated_at BEFORE UPDATE ON public.voice_audit_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_voice_bookings_updated_at BEFORE UPDATE ON public.voice_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_voice_followups_updated_at BEFORE UPDATE ON public.voice_followups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();